
FROM oven/bun:latest

# git 설치
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Git 사용자 설정 추가
# RUN git config --global user.name "bun dev" && \
#     git config --global user.email "sixtick65@gmail.com"


WORKDIR /root

