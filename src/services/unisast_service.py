import logging
from typing import TypedDict

from ollama import generate, pull

logger = logging.getLogger(__name__)


class SASTInput(TypedDict):
    vulnerability_type: str
    file: str
    problematic_code: str
    vulnerability_description: str


class ModelNotFoundError(Exception):
    pass


class UniSASTService:
    _instance = None
    _model_loaded = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.model = "callmeserein/unisast"

    def _ensure_model_loaded(self):
        if not self._model_loaded:
            try:
                pull(model=self.model)
                self._model_loaded = True
            except Exception:
                raise ModelNotFoundError(f"Failed to load model {self.model}")

    def fix_vulnerability(self, vulnerability: SASTInput) -> str:
        self._ensure_model_loaded()
        prompt = f"""Vulnerability Type: {vulnerability['vulnerability_type']}
File: {vulnerability['file']}
Code: {vulnerability['problematic_code']}
Description: {vulnerability['vulnerability_description']}
"""
        response = generate(
            model=self.model,
            prompt=prompt,
            stream=False
        )
        return response.response if hasattr(response, 'response') else str(response)

    def stream_fix_vulnerability(self, vulnerability: SASTInput):
        self._ensure_model_loaded()
        prompt = f"""Vulnerability Type: {vulnerability['vulnerability_type']}
File: {vulnerability['file']}
Code: {vulnerability['problematic_code']}
Description: {vulnerability['vulnerability_description']}
"""
        for chunk in generate(model=self.model, prompt=prompt, stream=True):
            if hasattr(chunk, 'response'):
                yield chunk.response
