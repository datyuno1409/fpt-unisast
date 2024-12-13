# **FPT UniSAST**

## Mục Lục

- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Cài Đặt](#cài-đặt)
- [Phát Triển](#phát-triển)
- [Cấu Hình Docker](#cấu-hình-docker)
- [Tài Liệu API](#tài-liệu-api)

## Cấu Trúc Dự Án

```
FPT/
├── .github/
├── src/
│   ├── api/
│   ├── config/
│   ├── services/
│   ├── utils/
│   └── main.py
├── templates/
├── tests/
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

### Cài Đặt

#### Cách 1: Cài đặt trực tiếp
1. Tải xuống:
   - Tải `FPTUniSAST.exe` tại [đây](https://github.com/sonw-vh/unisast-app/releases/download/v1.0.0/FPTUniSAST.exe) 📥
2. Chạy file .exe để sử dụng

#### Cách 2: Cài đặt qua Docker
1. Clone repo:
    ```bash
    git clone https://github.com/sonw-vh/unisast-app
    cd unisast-app
    ```

2. Build và chạy với Docker:
    ```powershell
    docker-compose up --build
    ```

3. Update:
    ```powershell
    git pull
    docker compose up --build
    ```

4. Reset:
    ```powershell
    docker-compose down --rmi all
    ```

### Các Thành Phần Dự Án

- **API**: Nằm trong `src/api/`

    - Xử lý request và response HTTP
    - Định nghĩa các endpoint API

- **Services**: Nằm trong `src/services/`

    - Chứa logic chính của ứng dụng
    - Quản lý xử lý dữ liệu và tương tác

- **Cấu Hình**: Nằm trong `src/config/`

    - Quản lý cài đặt ứng dụng

- **Utils**: Nằm trong `src/utils/`
    - Các hàm hỗ trợ và tiện ích chung
    - Chức năng dùng chung trong ứng dụng

## Cấu Hình Docker

Dự án sử dụng Docker để container hóa:

- `Dockerfile`: Định nghĩa cấu hình container ứng dụng
- `docker-compose.yml`: Chạy sync khi dev với docker

## Tài Liệu API

1. Khởi động ứng dụng:

    ```powershell
    docker-compose up --build
    ```

2. Truy cạp: [http://localhost:5000/docs](http://localhost:5000/docs)

# [@callmeserein](https://t.me/callmeserein)
