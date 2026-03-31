import Job from "../../models/job.js";

export const createJob = (data) => Job.create(data);

export const getJobs = (query) => Job.find(query).sort({ createdAt: -1 });
