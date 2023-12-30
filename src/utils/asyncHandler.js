const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    if (req.errCb) {
      req.errCb();
    }

    res.status(+err.statusCode || 500).json({
      success: false,
      code: err.code,
      statusCode: +err.statusCode || 500,
      message: err.message,
    });
  }
};

export default asyncHandler;
