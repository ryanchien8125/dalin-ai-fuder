FROM node:22-slim

RUN mkdir -p /nuxt-app/.output
WORKDIR /nuxt-app
COPY dist /nuxt-app/.output
COPY ./ecosystem.config.cjs /nuxt-app

RUN npm install -g pm2 --production

ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["pm2-runtime", "start", "./ecosystem.config.cjs"]