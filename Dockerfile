FROM python:3.10
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential pkg-config
COPY requirements.txt /app/requirements.txt
WORKDIR /app
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
CMD ["gunicorn", "app:app"]
