const { Router } = require('express');

const router = Router();

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

module.exports = router;
