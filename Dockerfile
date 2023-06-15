FROM node:18.14.2

WORKDIR usr/src/app

# Install Packages
COPY package*.json ./
RUN npm Install

# Specify production environment
ENV NODE_ENV=production

# Copy files over
COPY . .

# Build it
RUN npm run Build

# Serve it
CMD ["npm", "start"]