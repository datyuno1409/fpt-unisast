import os

import magic
from flask import Flask, current_app

base_dir = os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))
project_dir = os.path.dirname(base_dir)
static_folder = os.path.join(project_dir, 'templates')


def create_app(config_object=None):
    app = Flask(__name__, template_folder=static_folder,
                static_folder=static_folder)
    if config_object:
        app.config.from_object(config_object)
    from api.routes import bp
    app.register_blueprint(bp)
    return app


def validate_file_type(file_path):
    mime = magic.Magic(mime=True)
    file_type = mime.from_file(file_path)
    return file_type in ['application/zip', 'application/x-zip-compressed']


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower(
           ) in current_app.config['ALLOWED_EXTENSIONS']
