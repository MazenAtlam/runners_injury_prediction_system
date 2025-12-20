# Use an official lightweight Python image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR .

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Set environment variables
# HF Spaces run on port 7860 by default
ENV PORT=7860
# Python won't buffer output (better for logs)
ENV PYTHONUNBUFFERED=1

# Expose the port
EXPOSE 7860

# Start the application using Gunicorn
# app:app refers to looking in 'run.py' for the 'app' object
CMD ["gunicorn", "-b", "0.0.0.0:7860", "run:app"]