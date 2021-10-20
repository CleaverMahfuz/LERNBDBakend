class APIQueryFeatures {
	constructor(query, queryString) {
		this.query = query;
		this.queryString = queryString;
	}

	filter() {
		const queryObj = { ...this.queryString };
		const excludeFields = ['sort', 'fields', 'page', 'limit'];
		excludeFields.forEach((el) => delete queryObj[el]);

		const queryStr = JSON.stringify(queryObj).replace(
			/\b(eq|ne|gte|gt|lte|lt|in|nin)\b/g,
			(matches) => `$${matches}`,
		);

		this.query = this.query.find(JSON.parse(queryStr));

		return this;
	}

	sort() {
		if (this.queryString.sort) {
			this.query = this.query.sort(this.queryString.sort.split(',').join(' '));
		} else {
			this.query = this.query.sort('-createdAt');
		}

		return this;
	}

	fields() {
		if (this.queryString.fields) {
			this.query = this.query.select(this.queryString.fields.split(',').join(' '));
		} else {
			this.query = this.query.select('-__v');
		}

		return this;
	}

	paginate() {
		const page = parseInt(this.queryString.page, 10) || 1;
		const limit = parseInt(this.queryString.limit, 10) || 100;
		let skip = (page - 1) * limit;
		skip = skip < 0 ? 0 : skip;

		this.query = this.query.skip(skip).limit(limit);

		return this;
	}
}

module.exports = APIQueryFeatures;
