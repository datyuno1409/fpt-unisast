import os
from mimetypes import add_type

from flask import send_file, send_from_directory
from flask_restx import Api

from api.routes import api as namespace
from config.config import BaseConfig
from utils.utils import create_app


def configure_mime_types():
    for ext, mime_type in BaseConfig.MIME_TYPES.items():
        add_type(mime_type, f'.{ext}', strict=True)


app = create_app(BaseConfig)
configure_mime_types()

api = Api(app,
          version='1.0',
          title='FPT UniSAST API Docs',
          description='API for FPT UniSAST',
          doc='/docs',
          prefix='/api'
          )

api.add_namespace(namespace)


@app.route('/')
def index():
    if app.static_folder is None:
        return "Đường dẫn hợp lệ", 404
    return send_from_directory(app.static_folder, 'index.html')


@app.route("/<path:path>")
def catch_all(path):
    if not app.static_folder:
        return "Đường dẫn không hợp lệ", 500
    if not isinstance(path, str):
        return "Đường dẫn không hợp lệ", 400
    base_dir = os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)))
    project_dir = os.path.dirname(base_dir)
    static_path = os.path.join(app.static_folder, path)
    if os.path.exists(static_path):
        _, ext = os.path.splitext(path)
        ext = ext.lstrip('.')
        mime_type = BaseConfig.MIME_TYPES.get(ext)
        if mime_type:
            return send_file(static_path, mimetype=mime_type)
        return send_file(static_path)
    template_path = os.path.join(project_dir, 'templates', path)
    if os.path.exists(template_path):
        return send_file(template_path)
    if app.static_folder is None:
        return "Địa chỉ không hợp lệ", 404
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
