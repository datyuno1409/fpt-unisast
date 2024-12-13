import logging

from flask import Response, current_app, request
from flask_restx import Namespace, Resource, fields

from api import bp
from services.cache_service import CacheService
from services.scanner import CodeScanner
from services.unisast_service import SASTInput, UniSASTService
from utils.utils import allowed_file

logger = logging.getLogger(__name__)


@bp.after_request
def add_security_headers(response):
    for header, value in current_app.config['SECURITY_HEADERS'].items():
        response.headers[header] = value
    return response


unisast_service = UniSASTService()
cache_service = CacheService()

api = Namespace('/', description='API FPT Unisast')

response_model = api.model('Response', {
    'status': fields.String(required=True, description='(success/error)'),
    'message': fields.String(required=False, description='')
})

scan_result_model = api.model('ScanResult', {
    'status': fields.String(required=True, description='(success/error)'),
    'results': fields.Raw(required=True, description='')
})

fix_vulnerability_model = api.model('FixVulnerability', {
    'status': fields.String(required=True, description='(success/error)'),
    'fixed_code': fields.String(required=True, description='')
})

vulnerability_input = api.model('VulnerabilityInput', {
    'vulnerability_type': fields.String(required=True),
    'file': fields.String(required=True),
    'problematic_code': fields.String(required=True),
    'vulnerability_description': fields.String(required=True)
})


@api.route('/test')
class Test(Resource):
    @api.doc('test',
             description='test xem server chạy không',
             responses={
                 200: ('Thành công', response_model)
             })
    def get(self):
        return {
            'status': 'success',
            'message': 'Đang hoạt động'
        }


@api.route('/scan')
class ScanCode(Resource):
    @api.doc('scan_code',
             description='quét code để phát hiện các vấn đề bảo mật',
             responses={
                 200: ('Quét thành công', scan_result_model),
                 400: ('Lỗi dữ liệu đầu vào', response_model),
                 500: ('Lỗi hệ thống', response_model)
             })
    @api.expect(api.parser()
                .add_argument('file', location='files', type='FileStorage', required=True,
                              help='File ZIP chứa mã nguồn cần quét'))
    def post(self):
        try:
            if 'file' not in request.files:
                return {
                    'status': 'error',
                    'message': 'Không tìm thấy tệp tin'
                }, 400

            file = request.files['file']

            if file.filename == '':
                return {
                    'status': 'error',
                    'message': 'Chưa chọn tệp tin'
                }, 400

            if not allowed_file(file.filename):
                return {
                    'status': 'error',
                    'message': 'Định dạng tệp tin không hợp lệ. Chỉ chấp nhận tệp tin ZIP'
                }, 400

            scanner = CodeScanner()
            scan_results = scanner.scan_file(file)

            return {
                'status': 'success',
                'results': scan_results.data
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }, 500


@api.route('/rescan')
class Rescan(Resource):
    @api.doc('rescan_code',
             description='Quét lại code đã được tải lên trước đó',
             responses={
                 200: ('Quét thành công', scan_result_model),
                 400: ('Lỗi khi quét', response_model),
                 500: ('Lỗi server', response_model)
             })
    def post(self):
        try:
            scanner = CodeScanner()
            result = scanner.rescan()

            if not result.success:
                return {
                    'status': 'error',
                    'message': result.error or 'Lỗi không xác định khi quét lại code'
                }, 400

            return {
                'status': 'success',
                'results': result.data
            }, 200

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Lỗi server: {str(e)}'
            }, 500


@api.route('/fix')
class FixVulnerability(Resource):
    @api.doc('fix_vulnerability',
             description='sửa lỗi bảo mật',
             responses={
                 200: ('Sửa lỗi thành công', fix_vulnerability_model),
                 400: ('Lỗi dữ liệu đầu vào', response_model),
                 500: ('Lỗi hệ thống', response_model)
             })
    @api.expect(vulnerability_input)
    def post(self):
        try:
            if not request.is_json:
                logger.warning("Nhận được request không phải JSON")
                return {
                    'status': 'error',
                    'message': 'Yêu cầu phải là JSON'
                }, 400

            data = request.get_json()
            required_fields = ['vulnerability_type', 'file',
                               'problematic_code', 'vulnerability_description']

            missing_fields = [
                field for field in required_fields if field not in data]
            if missing_fields:
                logger.warning(f"Thiếu các trường: {missing_fields}")
                return {
                    'status': 'error',
                    'message': f'Thiếu các trường bắt buộc: {", ".join(missing_fields)}'
                }, 400

            vulnerability = SASTInput(**data)

            cached_result = cache_service.get_cached_fix(vulnerability)
            if cached_result:
                logger.info("Trả về kết quả từ cache")
                return {
                    'status': 'success',
                    'fixed_code': cached_result
                }

            fixed_code = unisast_service.fix_vulnerability(vulnerability)
            if not fixed_code:
                logger.error("Không thể tạo mã sửa lỗi")
                return {
                    'status': 'error',
                    'message': 'Không thể tạo mã sửa lỗi'
                }, 500

            cache_service.cache_fix(vulnerability, fixed_code)

            return {
                'status': 'success',
                'fixed_code': fixed_code
            }

        except Exception as e:
            logger.error(f"Lỗi khi sửa lỗi bảo mật: {str(e)}")
            return {
                'status': 'error',
                'message': f'Lỗi hệ thống: {str(e)}'
            }, 500


@api.route('/fix/stream')
class StreamFixVulnerability(Resource):
    def get_stream(self, vulnerability: SASTInput):
        def generate():
            try:
                for chunk in unisast_service.stream_fix_vulnerability(vulnerability):
                    if chunk:
                        yield chunk
            except Exception as e:
                logger.error(f"Lỗi streaming: {str(e)}")
                yield str(e)
            finally:
                yield "[DONE]"

        return generate()

    @api.doc('stream_fix_vulnerability',
             description='sửa lỗi bảo mật với streaming response',
             responses={200: ('Stream sửa lỗi thành công', response_model)})
    @api.expect(vulnerability_input)
    def post(self):
        if not request.json or not all(key in request.json for key in ['vulnerability_type', 'file', 'problematic_code', 'vulnerability_description']):
            return {'error': 'Thiếu thông tin trong yêu cầu'}, 400

        vulnerability = {
            'vulnerability_type': request.json['vulnerability_type'],
            'file': request.json['file'],
            'problematic_code': request.json['problematic_code'],
            'vulnerability_description': request.json['vulnerability_description']
        }

        generator = self.get_stream(vulnerability)
        response = []
        for chunk in generator:
            response.append(chunk)
        return Response(
            response,
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )
