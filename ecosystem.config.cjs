module.exports = {
  apps: [
    {
      name: 'DalinAI-Fuder',
      exec_mode: 'cluster',
      instances: '-1',
      script: './.output/server/index.mjs',
    },
  ],
}
