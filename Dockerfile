# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for some python packages like nltk/numpy potentially)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Download NLTK data during build to avoid download on startup every time
RUN python -m nltk.downloader stopwords

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run app.py when the container launches using Gunicorn
CMD ["gunicorn", "-c", "config/gunicorn_config.py", "app:app"]
