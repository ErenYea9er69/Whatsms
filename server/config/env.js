const Joi = require('joi');

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    // PORT is managed by Vercel in production
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().min(8).required(),
    // Allow empty string or URI
    CLIENT_URL: Joi.string().allow('').optional(),
    // Allow any other vars
}).unknown(true);

module.exports = {
    validateEnv: () => {
        const { error, value } = envSchema.validate(process.env);
        if (error) {
            throw new Error(`Config validation error: ${error.message}`);
        }
        return value;
    }
};
