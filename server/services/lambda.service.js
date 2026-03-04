import axios from "axios";

export const triggerJobProcessor = async (job) => {
    try {
        await axios.post(process.env.LAMBDA_URL, {
            event: "job_created",
            ...job.toObject() // Send the full job document
        });
        console.log("Lambda trigger successful");
    } catch (err) {
        console.error("Lambda trigger failed:", err.message);
    }
};