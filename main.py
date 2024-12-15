import ctypes
import os
import os.path
import subprocess
import sys
import time
import webbrowser
from pathlib import Path
from typing import NoReturn, Optional

import requests
from PyQt5.QtCore import QByteArray, Qt, QThread, QTimer, pyqtSignal
from PyQt5.QtGui import QColor, QFont, QIcon, QPainter, QPixmap
from PyQt5.QtWidgets import (QApplication, QGraphicsDropShadowEffect,
                             QHBoxLayout, QLabel, QMainWindow, QMessageBox,
                             QPushButton, QVBoxLayout, QWidget)


class LoadingOverlay(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WA_TransparentForMouseEvents)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self._angle = 0
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._rotate)
        self._timer.setInterval(50)

        layout = QVBoxLayout()
        self.setLayout(layout)

        layout.addStretch()

        self.message_label = QLabel()
        self.message_label.setAlignment(Qt.AlignCenter)
        self.message_label.setStyleSheet("""
            QLabel {
                color: white;
                font-size: 14px;
                font-weight: bold;
                background-color: transparent;
                margin-top: 60px;
            }
        """)
        layout.addWidget(self.message_label)

        layout.addStretch()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        painter.fillRect(self.rect(), QColor(0, 0, 0, 180))

        painter.translate(self.width() / 2, (self.height() / 2) - 40)
        painter.rotate(self._angle)

        for i in range(8):
            painter.rotate(45)
            alpha = 255 - (i * 32)
            painter.setPen(Qt.NoPen)
            painter.setBrush(QColor(45, 90, 245, alpha))
            painter.drawRect(-4, -20, 8, 12)

    def _rotate(self):
        self._angle = (self._angle + 45) % 360
        self.update()

    def show(self, message="Đang xử lý..."):
        super().show()
        self.message_label.setText(message)
        self._timer.start()
        self.raise_()

    def hide(self):
        self._timer.stop()
        super().hide()


class DockerInstallWorker(QThread):
    finished = pyqtSignal(bool, str)

    def run(self):
        try:
            subprocess.run(
                ["choco", "install", "docker-desktop", "-y"], check=True)
            self.finished.emit(True, "")
        except subprocess.CalledProcessError as e:
            self.finished.emit(False, str(e))


class SystemResetWorker(QThread):
    finished = pyqtSignal(bool, str)
    progress = pyqtSignal(str)

    def run(self):
        try:

            try:
                subprocess.run(["docker", "info"], check=True,
                               capture_output=True)
            except subprocess.CalledProcessError:
                self.progress.emit(
                    "Docker không hoạt động, bỏ qua các lệnh Docker...")
                self.finished.emit(True, "")
                return

            self.progress.emit("Đang fetch repository...")
            subprocess.run(["git", "fetch", "--all"], check=True)

            self.progress.emit("Đang reset code...")
            subprocess.run(["git", "reset", "--hard",
                           "origin/main"], check=True)

            self.progress.emit("Đang dọn dẹp Docker...")
            subprocess.run(["docker", "system", "prune", "-af"], check=True)
            subprocess.run(["docker", "volume", "prune", "-f"], check=True)

            self.finished.emit(True, "")
        except subprocess.CalledProcessError as e:
            self.finished.emit(False, str(e))


class UpdateCheckWorker(QThread):
    finished = pyqtSignal(bool, str, str)
    progress = pyqtSignal(str)

    def __init__(self, repo_url: str, documents_path: str):
        super().__init__()
        self.repo_url = repo_url
        self.documents_path = documents_path

    def run(self):
        try:
            if not os.path.exists(self.documents_path):
                self.progress.emit("Đang clone repository...")
                subprocess.run(
                    ["git", "clone", "-b", "main",
                        self.repo_url, self.documents_path],
                    check=True,
                    capture_output=True
                )
                self.finished.emit(
                    True, f"Đã clone repository vào:\n{self.documents_path}", "")
            else:
                os.chdir(self.documents_path)
                self.progress.emit("Đang kiểm tra cập nhật...")
                result = subprocess.run(["git", "pull"],
                                        check=True,
                                        capture_output=True,
                                        text=True)
                if "Already up to date" in result.stdout:
                    self.finished.emit(
                        True, "Hệ thống đã được cập nhật mới nhất!", "")
                else:
                    self.finished.emit(True, "Cập nhật hoàn tất!", "")
        except subprocess.CalledProcessError as e:
            self.finished.emit(False, "", str(e.stderr))


class DockerStartWorker(QThread):
    finished = pyqtSignal(bool, str)
    progress = pyqtSignal(str)

    def __init__(self, repo_path: str, docker_desktop_path: str):
        super().__init__()
        self.repo_path = repo_path
        self.docker_desktop_path = docker_desktop_path

    def run(self):
        try:

            try:
                subprocess.run(["docker", "info"], check=True,
                               capture_output=True)
            except subprocess.CalledProcessError:
                self.progress.emit("Đang khởi động Docker Desktop...")
                subprocess.Popen([self.docker_desktop_path])

                for _ in range(60):
                    try:
                        subprocess.run(["docker", "info"],
                                       check=True, capture_output=True)
                        break
                    except subprocess.CalledProcessError:
                        time.sleep(1)
                else:
                    raise subprocess.SubprocessError(
                        "Không thể khởi động Docker Desktop. Vui lòng khởi động thủ công.")

            self.progress.emit("Đang build containers...")
            subprocess.run(
                ["docker", "compose", "build"],
                check=True,
                cwd=self.repo_path
            )

            self.progress.emit("Đang khởi động containers...")
            subprocess.run(
                ["docker", "compose", "up", "-d"],
                check=True,
                cwd=self.repo_path
            )

            self.progress.emit("Đang đợi service khởi động...")
            for _ in range(30):
                try:
                    response = requests.get("http://localhost:5000")
                    if response.status_code == 200:
                        break
                except requests.RequestException:
                    time.sleep(1)
            else:
                print("Service chưa sẵn sàng sau 30 giây")

            self.finished.emit(True, "")
        except (subprocess.CalledProcessError, requests.RequestException) as e:
            self.finished.emit(False, str(e))


class ExitWorker(QThread):
    finished = pyqtSignal()
    progress = pyqtSignal(str)

    def __init__(self, docker_compose_file: str):
        super().__init__()
        self.docker_compose_file = docker_compose_file

    def run(self):
        try:
            if os.path.exists(self.docker_compose_file):
                try:
                    self.progress.emit("Đang kiểm tra Docker...")
                    subprocess.run(["docker", "info"],
                                   check=True,
                                   capture_output=True)

                    self.progress.emit("Đang dừng containers...")
                    subprocess.run(["docker", "compose", "down"],
                                   check=True,
                                   cwd=os.path.dirname(self.docker_compose_file))
                except subprocess.CalledProcessError:
                    pass
        except (subprocess.CalledProcessError, OSError) as e:
            print(f"Lỗi khi tắt Docker: {str(e)}")
        finally:
            self.finished.emit()


class FPTUniSAST(QMainWindow):
    HELP_URL = "https://github.com/datyuno1409/fpt-unisast"
    REPO_URL = "https://github.com/datyuno1409/fpt-unisast.git"
    CHOCO_INSTALL_CMD = """powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" """
    GIT_INSTALL_PARAMS = """/GitAndUnixToolsOnPath /NoShellIntegration /NoGuiHereIntegration /NoShellHereIntegration /SChannel"""

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("FPT UniSAST")
        self.setFixedSize(500, 600)
        self.setStyleSheet("""
            QMainWindow {
                background-color: #1a1a1a;
            }
            QWidget {
                background-color: #1a1a1a;
            }
            QPushButton {
                background-color: #2d5af5;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 15px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #4169e1;
            }
            QPushButton:pressed {
                background-color: #1e3cc7;
            }
            QLabel {
                color: white;
            }
        """)
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout()
        main_widget.setLayout(layout)
        title_label = QLabel("FPT UniSAST")
        title_label.setAlignment(Qt.AlignCenter)
        title_font = QFont()
        title_font.setPointSize(24)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setStyleSheet("""
            color: #2d5af5;
            margin: 20px 0;
            font-weight: bold;
        """)
        layout.addWidget(title_label)
        buttons_container = QWidget()
        main_layout = QHBoxLayout()
        buttons_container.setLayout(main_layout)
        buttons_container.setStyleSheet("""
            QWidget {
                background-color: #242424;
                border-radius: 15px;
                padding: 20px;
                border: 1px solid #333333;
            }
        """)

        left_column = QVBoxLayout()
        right_column = QVBoxLayout()

        left_buttons = [

            ("🐳 Cài Docker", self.install_docker),
            ("🔄 Cập nhật", self.check_updates),
            ("🔄 Reset", self.reset_system),
        ]

        right_buttons = [
            ("🚀 Khởi động", self.start_system),
            ("❓ Trợ giúp", self.show_help),
            ("🚪 Thoát", self.exit_program),
        ]

        def create_button(text, handler):
            button = QPushButton(text)
            button.setFixedHeight(80)
            button.setCursor(Qt.PointingHandCursor)
            button.clicked.connect(handler)
            button.setStyleSheet("""
                QPushButton {
                    background-color: #2d5af5;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 15px;
                    font-weight: bold;
                    font-size: 14px;
                    text-align: left;
                    padding-left: 20px;
                }
                QPushButton:hover {
                    background-color: #4169e1;
                }
                QPushButton:pressed {
                    background-color: #1e3cc7;
                }
            """)
            return button

        for text, handler in left_buttons:
            button = create_button(text, handler)
            left_column.addWidget(button)

        for text, handler in right_buttons:
            button = create_button(text, handler)
            right_column.addWidget(button)

        left_column.setSpacing(15)
        right_column.setSpacing(15)

        left_widget = QWidget()
        right_widget = QWidget()
        left_widget.setLayout(left_column)
        right_widget.setLayout(right_column)

        main_layout.addWidget(left_widget)
        main_layout.addWidget(right_widget)

        main_layout.setSpacing(20)

        layout.addWidget(buttons_container)

        copyright_label = QLabel("© 2024 FPT UniSAST. All rights reserved.")
        copyright_label.setAlignment(Qt.AlignCenter)
        copyright_font = QFont()
        copyright_font.setPointSize(9)
        copyright_label.setFont(copyright_font)
        copyright_label.setStyleSheet("""
            color: #888888;
            margin: 20px 0;
            font-style: italic;
        """)
        layout.addWidget(copyright_label)

        layout.setSpacing(20)
        layout.setContentsMargins(30, 30, 30, 30)

        self.loading = LoadingOverlay(self)
        self.loading.resize(self.size())
        self.loading.hide()

        self.docker_worker = None
        self.reset_worker = None

    def show_message(self, title: str, message: str, icon: QMessageBox.Icon = QMessageBox.Information) -> None:
        msg = QMessageBox()
        msg.setWindowTitle(title)
        msg.setText(message)

        msg.setStyleSheet("""
            QMessageBox {
                background-color: #242424;
                border: 1px solid #333333;
                border-radius: 10px;
                min-width: 400px;
            }
            QLabel {
                color: white;
                font-size: 14px;
                padding: 20px;
            }
            QPushButton {
                background-color: #2d5af5;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 8px 20px;
                font-weight: bold;
                min-width: 100px;
                margin: 10px;
            }
            QPushButton:hover {
                background-color: #4169e1;
            }
            QPushButton:pressed {
                background-color: #1e3cc7;
            }
            QDialogButtonBox {
                button-layout: center;
                margin: 15px;
            }
            QMessageBox QLabel:first-child {
                background-color: #1a1a1a;
                color: white;
                font-weight: bold;
                padding: 10px;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
                border-bottom: 1px solid #333333;
            }
            QMessageBox QLabel#qt_msgbox_label {
                min-height: 40px;
                padding: 20px;
                font-weight: bold;
            }
        """)

        button_texts = {
            QMessageBox.Ok: "Đồng ý",
            QMessageBox.Cancel: "Hủy",
            QMessageBox.Yes: "Có",
            QMessageBox.No: "Không",
        }

        for button in msg.buttons():
            if button.text() in button_texts:
                button.setText(button_texts[button.text()])

        msg.setWindowFlags(
            Qt.Dialog | Qt.CustomizeWindowHint | Qt.WindowTitleHint)

        effect = QGraphicsDropShadowEffect(msg)
        effect.setBlurRadius(20)
        effect.setXOffset(0)
        effect.setYOffset(0)
        effect.setColor(QColor(0, 0, 0, 150))
        msg.setGraphicsEffect(effect)

        msg.setGeometry(
            self.geometry().center().x() - msg.width() // 2,
            self.geometry().center().y() - msg.height() // 2,
            msg.width(),
            msg.height()
        )

        return msg.exec_()

    def is_git_installed(self) -> bool:
        try:
            subprocess.run(["git", "--version"],
                           check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def is_docker_installed(self) -> bool:
        try:
            subprocess.run(["docker", "--version"],
                           check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def is_chocolatey_installed(self) -> bool:
        try:
            subprocess.run(["choco", "--version"],
                           check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def install_chocolatey(self) -> bool:
        try:
            self.show_message("Thông báo", "Đang cài đặt Chocolatey...")
            subprocess.run(self.CHOCO_INSTALL_CMD, shell=True, check=True)
            subprocess.run("refreshenv", shell=True)
            return True
        except subprocess.CalledProcessError:
            self.show_message(
                "Lỗi",
                "Không thể cài đặt Chocolatey. Vui lòng thử lại với quyền Administrator.",
                QMessageBox.Critical
            )
            return False

    def check_updates(self) -> None:
        if not self.is_admin():
            self.show_message(
                "Lỗi",
                "Vui lòng chạy ứng dụng với quyền Administrator để thực hiện thao tác này.",
                QMessageBox.Critical
            )
            return

        try:
            documents_path = os.path.join(
                str(Path.home()), "Documents", "fpt-unisast")

            self.loading.show("Đang kiểm tra cập nhật...")

            self.update_worker = UpdateCheckWorker(
                self.REPO_URL, documents_path)
            self.update_worker.finished.connect(self._update_check_finished)
            self.update_worker.progress.connect(self._update_check_progress)
            self.update_worker.start()

        except Exception as e:
            self.loading.hide()
            self.show_message(
                "Lỗi",
                f"Lỗi không xác định: {str(e)}",
                QMessageBox.Critical
            )

    def _update_check_progress(self, message: str):
        self.loading.show(message)

    def _update_check_finished(self, success: bool, message: str, error: str):
        self.loading.hide()
        if success:
            self.show_message("Thành công", message)
            if "clone" in message:
                os.chdir(os.path.join(str(Path.home()),
                         "Documents", "fpt-unisast"))
        else:
            self.show_message(
                "Lỗi",
                f"Lỗi khi cập nhật.\nLỗi: {error}",
                QMessageBox.Warning
            )

    def install_docker(self) -> None:
        if self.is_docker_installed():
            self.show_message(
                "Thông báo",
                "Docker đã được cài đặt trên hệ thống!",
                QMessageBox.Information
            )
            return

        try:
            if not self.is_chocolatey_installed():
                self.loading.show("Đang cài đặt Chocolatey...")
                if not self.install_chocolatey():
                    self.loading.hide()
                    return

            self.loading.show(
                "Đang cài đặt Docker Desktop...\nQuá trình này có thể mất vài phút")

            self.docker_worker = DockerInstallWorker()
            self.docker_worker.finished.connect(self._docker_install_finished)
            self.docker_worker.start()

        except Exception as e:
            self.loading.hide()
            self.show_message(
                "Lỗi",
                f"Lỗi khi cài đặt Docker: {str(e)}",
                QMessageBox.Warning
            )

    def _docker_install_finished(self, success: bool, error: str):
        self.loading.hide()

        if success:
            reply = QMessageBox.question(
                self,
                "Cài đặt hoàn tất",
                "Docker đã được cài đặt thành công! Bạn có muốn khởi động lại máy tính ngay bây giờ không?",
                QMessageBox.Yes | QMessageBox.No
            )

            if reply == QMessageBox.Yes:
                subprocess.run(["shutdown", "/r", "/t", "0"], check=True)
            else:
                self.show_message(
                    "Thông báo",
                    "Vui lòng khởi động lại máy tính để hoàn tất cài đặt Docker.",
                    QMessageBox.Information
                )
        else:
            self.show_message(
                "Lỗi",
                f"Lỗi khi cài đặt Docker: {error}",
                QMessageBox.Warning
            )

    def reset_system(self) -> None:
        try:
            self.loading.show("Đang reset hệ thống...")

            self.reset_worker = SystemResetWorker()
            self.reset_worker.finished.connect(self._reset_system_finished)
            self.reset_worker.progress.connect(self._update_reset_progress)
            self.reset_worker.start()

        except Exception as e:
            self.loading.hide()
            self.show_message(
                "Lỗi",
                f"Lỗi khi reset hệ thống: {str(e)}",
                QMessageBox.Warning
            )

    def _update_reset_progress(self, message: str):
        self.loading.show(message)

    def _reset_system_finished(self, success: bool, error: str):
        self.loading.hide()

        if success:
            self.show_message("Thành công", "Reset hoàn tất!")
        else:
            self.show_message(
                "Lỗi",
                f"Lỗi khi reset hệ thống: {error}",
                QMessageBox.Warning
            )

    def start_system(self) -> None:
        try:

            repo_path = os.path.join(
                str(Path.home()), "Documents", "fpt-unisast")
            docker_compose_file = os.path.join(repo_path, "docker-compose.yml")

            if not os.path.exists(repo_path):
                self.show_message(
                    "Lỗi",
                    "Vui lòng kiểm tra cập nhật trước khi khởi động hệ thống.",
                    QMessageBox.Warning
                )
                return

            if not os.path.exists(docker_compose_file):
                self.show_message(
                    "Lỗi",
                    "Không tìm thấy file docker-compose.yml.\nVui lòng kiểm tra cập nhật lại.",
                    QMessageBox.Warning
                )
                return

            docker_desktop_path = "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
            if not os.path.exists(docker_desktop_path):
                raise FileNotFoundError(
                    "Không tìm thấy Docker Desktop. Vui lòng cài đặt Docker Desktop trước.")

            os.chdir(repo_path)

            self.loading.show("Đang khởi động Docker Desktop...")

            self.docker_start_worker = DockerStartWorker(
                repo_path, docker_desktop_path)
            self.docker_start_worker.finished.connect(
                self._docker_start_finished)
            self.docker_start_worker.progress.connect(
                self._docker_start_progress)
            self.docker_start_worker.start()

        except Exception as e:
            self.loading.hide()
            self.show_message(
                "Lỗi",
                f"Lỗi khi khởi động Docker: {str(e)}",
                QMessageBox.Warning
            )

    def _docker_start_progress(self, message: str):
        self.loading.show(message)

    def _docker_start_finished(self, success: bool, error: str):
        self.loading.hide()
        if success:
            self.show_message("Thành công", "Docker đã được khởi động!")
            webbrowser.open("http://localhost:5000")
        else:
            self.show_message(
                "Lỗi",
                f"Lỗi khi khởi động Docker: {error}",
                QMessageBox.Warning
            )

    def show_help(self) -> None:
        webbrowser.open(self.HELP_URL)

    def exit_program(self) -> None:
        self.loading.show("Đang thoát ứng dụng...")

        docker_compose_file = os.path.join(
            str(Path.home()), "Documents", "fpt-unisast", "docker-compose.yml")
        self.exit_worker = ExitWorker(docker_compose_file)
        self.exit_worker.finished.connect(self._exit_finished)
        self.exit_worker.progress.connect(self._exit_progress)
        self.exit_worker.start()

    def _exit_progress(self, message: str):
        self.loading.show(message)

    def _exit_finished(self):
        self.loading.hide()
        QApplication.quit()

    def is_admin(self) -> bool:
        try:
            return ctypes.windll.shell32.IsUserAnAdmin()
        except Exception:
            return False


def icon_from_base64(base64):
    pixmap = QPixmap()
    pixmap.loadFromData(QByteArray.fromBase64(base64))
    icon = QIcon(pixmap)
    return icon


def main() -> Optional[NoReturn]:
    app = QApplication(sys.argv)

    image_base64 = b'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'
    icon = icon_from_base64(image_base64)

    window = FPTUniSAST()
    window.setWindowIcon(icon)
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
