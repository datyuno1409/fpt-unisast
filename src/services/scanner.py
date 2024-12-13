import errno
import json
import os
import shutil
import subprocess
from typing import Any, Dict, Optional

from werkzeug.utils import secure_filename

from utils.utils import validate_file_type

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads')
SCAN_DIR = os.path.join(UPLOAD_FOLDER, 'fpt_scan')
TMP_SCAN_DIR = '/tmp/fpt_scan'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

DEFAULT_SKIP_PATHS = ["tests/*", "examples/*",
                      "node_modules/*", "venv/*", ".git/*"]
DEFAULT_BEARER_FLAGS = ["--format=json",
                        "--report=security", "--quiet", "--hide-progress-bar"]
DEFAULT_SEMGREP_FLAGS = ["--config=auto", "--json", "--quiet"]


class ScanResult:
    def __init__(self, success: bool, data: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
        self.success = success
        self.data = data
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        result = {
            "success": self.success,
        }
        if self.data is not None:
            result["data"] = self.data
        if self.error is not None:
            result["error"] = self.error
        return result


class CodeScanner:
    def run_security_scan(self) -> ScanResult:
        results = {
            'semgrep': None,
            'bearer': None,
        }

        try:
            semgrep_cmd = ["semgrep", "scan"] + \
                DEFAULT_SEMGREP_FLAGS + [TMP_SCAN_DIR]
            bearer_cmd = ["bearer", "scan", TMP_SCAN_DIR] + DEFAULT_BEARER_FLAGS + [
                "--skip-path", ",".join(DEFAULT_SKIP_PATHS)
            ]

            if os.path.exists(os.path.join(PROJECT_ROOT, "bearer.yml")):
                bearer_cmd.extend(
                    ["--config-file", os.path.join(PROJECT_ROOT, "bearer.yml")])

            results['semgrep'] = self._execute_scan_command(semgrep_cmd)
            results['bearer'] = self._execute_scan_command(bearer_cmd)

            return ScanResult(success=True, data=results)

        except Exception as e:
            return ScanResult(success=False, error=f"Lỗi không mong muốn trong quá trình quét: {str(e)}")

    def _execute_scan_command(self, cmd: list[str]) -> dict:
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, env=os.environ)
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return {
                "error": result.stderr if result.stderr else "Failed to parse scan output"
            }

    def scan_file(self, file) -> Dict[str, Any]:
        try:
            self._prepare_scan_directory()

            zip_path = os.path.join(SCAN_DIR, secure_filename(file.filename))
            file.save(zip_path)

            if not validate_file_type(zip_path):
                return ScanResult(
                    success=False,
                    error="Tệp tin không phải là tệp ZIP hợp lệ"
                ).to_dict()

            self._extract_and_prepare_files(zip_path)
            scan_result = self.run_security_scan()
            return scan_result

        except Exception as e:
            return ScanResult(
                success=False,
                error=f"Lỗi khi xử lý tệp: {str(e)}"
            ).to_dict()

    def _validate_scan_directory(self) -> Optional[ScanResult]:
        if not os.path.exists(SCAN_DIR):
            return ScanResult(
                success=False,
                error="Không tìm thấy thư mục quét. Vui lòng tải lên tệp ZIP trước khi quét lại."
            )
        return None

    def rescan(self) -> ScanResult:
        try:
            validation_result = self._validate_scan_directory()
            if validation_result:
                return validation_result

            self._prepare_scan_directory(remove_scan_dir=False)
            self._copy_files_and_set_permissions()
            return self.run_security_scan()

        except Exception as e:
            return ScanResult(
                success=False,
                error=f"Lỗi trong quá trình quét lại: {str(e)}"
            )

    def _set_permissions(self, path: str) -> None:
        for root, dirs, files in os.walk(path):
            for d in dirs:
                os.chmod(os.path.join(root, d), 0o777)
            for f in files:
                os.chmod(os.path.join(root, f), 0o777)
        os.chmod(path, 0o777)

    def _remove_directory(self, path: str) -> None:
        try:
            if os.path.exists(path):
                shutil.rmtree(path, ignore_errors=True)
        except OSError as e:
            if e.errno == errno.EACCES:
                self._set_permissions(path)
                shutil.rmtree(path, ignore_errors=True)
            else:
                raise OSError(f"Không thể xóa thư mục {path}: {str(e)}")

    def _prepare_scan_directory(self, remove_scan_dir: bool = True) -> None:
        try:
            if os.path.exists(TMP_SCAN_DIR):
                self._remove_directory(TMP_SCAN_DIR)
            os.makedirs(os.path.dirname(TMP_SCAN_DIR), exist_ok=True)
            os.makedirs(TMP_SCAN_DIR)

            if remove_scan_dir:
                if os.path.exists(SCAN_DIR):
                    self._remove_directory(SCAN_DIR)
                os.makedirs(os.path.dirname(SCAN_DIR), exist_ok=True)
                os.makedirs(SCAN_DIR)
        except (OSError, IOError) as e:
            raise IOError(f"Không thể chuẩn bị thư mục quét: {str(e)}")

    def _extract_and_prepare_files(self, zip_path: str) -> None:
        shutil.unpack_archive(zip_path, SCAN_DIR)
        os.remove(zip_path)
        self._copy_files_and_set_permissions()

    def _copy_files_and_set_permissions(self) -> None:
        try:
            self._copy_files()
            self._set_scan_permissions()
        except (OSError, IOError) as e:
            raise IOError(f"Không thể copy files và set permissions: {str(e)}")

    def _copy_files(self) -> None:
        errors = []
        for item in os.listdir(SCAN_DIR):
            source = os.path.join(SCAN_DIR, item)
            dest = os.path.join(TMP_SCAN_DIR, item)

            try:
                if os.path.exists(dest):
                    self._remove_existing_path(dest)

                if os.path.isdir(source):
                    shutil.copytree(source, dest, dirs_exist_ok=True)
                else:
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    shutil.copy2(source, dest)
            except (OSError, IOError) as e:
                errors.append((source, dest, str(e)))

        if errors:
            raise IOError(str(errors))

    def _remove_existing_path(self, path: str) -> None:
        if os.path.isdir(path):
            self._remove_directory(path)
        else:
            os.remove(path)

    def _set_scan_permissions(self) -> None:
        os.chmod(TMP_SCAN_DIR, 0o755)
        for root, dirs, files in os.walk(TMP_SCAN_DIR):
            for d in dirs:
                os.chmod(os.path.join(root, d), 0o755)
            for f in files:
                os.chmod(os.path.join(root, f), 0o644)
