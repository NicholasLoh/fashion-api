const advanceResult = (modal, populate) => async (req, res, next) => {
  let query;

  let reqQuery = { ...req.query };

  //fields to exclude
  let exclude = ["select", "sort", "page", "limit"];

  //delete fields from exclude
  exclude.forEach((field) => {
    delete reqQuery[field];
  });

  let queryStr = JSON.stringify(reqQuery);

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  //find in db
  query = modal.find(JSON.parse(queryStr));

  //if select is specified
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  //if sort is given
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  //create limit and pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startInd = (page - 1) * limit;
  const endInd = page * limit;
  const total = await modal.countDocuments();

  query = query.skip(startInd).limit(limit);

  //populate
  if (populate) {
    query = query.populate(populate);
  }

  let results = await query;

  //pagination
  let pagination = {};

  if (startInd > 0) {
    pagination.prev = {
      page: page - 1,
      limit: limit,
    };
  }

  if (endInd < total) {
    pagination.next = {
      page: page + 1,
      limit: limit,
    };
  }

  res.advanceResult = {
    sucess: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advanceResult;
