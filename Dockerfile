FROM node:18.14.2

WORKDIR /app

# Install Packages
COPY package*.json ./
RUN npm install

# Specify production environment
ENV NODE_ENV=production

# Copy files over
COPY . .

# Build it
RUN npm run build

# Serve it
CMD ["npm", "start"]