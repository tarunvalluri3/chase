// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    error: {
      message: 'Internal server error',
    },
  });
}
