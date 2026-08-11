FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5009

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 5009

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const port=process.env.PORT||'5009';fetch('http://127.0.0.1:'+port+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npm", "start"]
