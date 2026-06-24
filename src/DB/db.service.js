// findOne
export const findOne = async ({
    model,
    filter = {},
    select = "",
    populate = [],
} = {}) => {
    return await model.findOne(filter).select(select).populate(populate);
};
// findById
export const findById = async ({
    model,
    id,
    select = "",
    populate = [],
} = {}) => {
    return await model.findById(id).select(select).populate(populate);
};

// create
export const create = async ({ model, data = [{}], options = {} } = {}) => {
    return await model.create(data, options);
};

// update
export const updateOne = async ({
    model,
    filter = {},
    update = {},
    options = {},
} = {}) => {
    return await model.updateOne(filter, update, options);
};

export const deleteOne = async ({
    model,
    filter = {},
    options = {},
} = {}) => {
    return await model.deleteOne(filter, options);
};
// findOneAndUpdate
export const findOneAndUpdate = async ({
    model,
    filter = {},
    update = {},
    select = "",
    populate = [],
    options = { new: true },
} = {}) => {
    return await model.findOneAndUpdate(filter, update, options).select(select).populate(populate);
};
export const findManyAndUpdate = async ({
    model,
    filter = {},
    update = {},
    select = "",
    populate = [],
    options = { new: true, multi: true }, // 'multi' is ignored in Mongoose 6+, use 'updateMany'
    returnUpdatedDocs = false, // control whether to return updated documents
} = {}) => {
    // First, update all matching documents
    await model.updateMany(filter, update, options);

    // If caller wants updated documents, fetch them
    if (returnUpdatedDocs) {
        let query = model.find(filter);
        if (select) query = query.select(select);
        if (populate.length) query = query.populate(populate);
        return await query;
    }

    // If not returning updated docs, return update result only
    return { acknowledged: true, updated: true };
};
