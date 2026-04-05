const { z } = require("zod");
const recordsService = require("./records.service");
const { ValidationError } = require("../../utils/errors");

const createRecordSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Category is required").max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date format"),
  notes: z.string().max(500).optional(),
});
const updateRecordSchema = createRecordSchema.partial();

const getRecords = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const userId = req.user.role === "ANALYST" ? req.user.id : undefined;
    const data = await recordsService.getRecords({ type, category, startDate, endDate, userId }, { page, limit });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getRecordById = async (req, res, next) => {
  try {
    const record = await recordsService.getRecordById(req.params.id, req.user);
    res.json({ success: true, data: { record } });
  } catch (err) { next(err); }
};

const createRecord = async (req, res, next) => {
  try {
    const result = createRecordSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    const record = await recordsService.createRecord(result.data, req.user.id);
    res.status(201).json({ success: true, message: "Record created", data: { record } });
  } catch (err) { next(err); }
};

const updateRecord = async (req, res, next) => {
  try {
    const result = updateRecordSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    if (Object.keys(result.data).length === 0) throw new ValidationError("No fields provided for update");
    const record = await recordsService.updateRecord(req.params.id, result.data, req.user);
    res.json({ success: true, message: "Record updated", data: { record } });
  } catch (err) { next(err); }
};

const deleteRecord = async (req, res, next) => {
  try {
    await recordsService.deleteRecord(req.params.id);
    res.json({ success: true, message: "Record deleted" });
  } catch (err) { next(err); }
};

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
