# Use an official Node.js runtime as a parent image
FROM node:alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Create data directory with proper permissions
RUN mkdir -p /usr/src/app/data && chmod 777 /usr/src/app/data

# Copy the rest of the application code
COPY . .

# Expose port 3001
EXPOSE 3001

# Run the application
CMD ["npm", "start"]
