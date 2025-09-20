FROM node:22-alpine

WORKDIR /react-app

COPY package*.json ./

# Install ALL dependencies (including devDependencies, needed for vite build)
RUN npm install

COPY . .

RUN npm run build

# Use a lightweight server for production
RUN npm install -g serve
CMD ["serve", "-s", "dist"]
