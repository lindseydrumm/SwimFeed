FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first to avoid redownloading on code change
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen

# Copy the rest of the code
COPY . .

CMD ["uv", "run", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0"]
