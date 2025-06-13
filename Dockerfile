# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 8080

# Run the app
CMD ["node", "app.js"]
