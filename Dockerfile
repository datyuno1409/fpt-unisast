FROM bearer/bearer:1.47.0 AS bearer
FROM python:3.10.16-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    dos2unix \
    libmagic1 \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && python -m pip install --upgrade pip \
    && python -m pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org semgrep==1.99.0

COPY --from=bearer /usr/local/bin/bearer /usr/local/bin/bearer
RUN curl -fsSL https://ollama.com/install.sh | sh

COPY requirements.txt .
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
COPY install_clamav.sh .
RUN chmod +x instal_clamav.sh && /app/install_clamav.sh
COPY . .
RUN find /app -type f -name "*.sh" -exec dos2unix {} \; && \
    chmod +x /app/start.sh
EXPOSE 5000
EXPOSE 11434

CMD ["/app/start.sh"]
