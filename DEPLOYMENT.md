# Deployment Guide for Render

## Prerequisites

1. **MongoDB Database**: You'll need a MongoDB database. You can use:
   - MongoDB Atlas (recommended for production)
   - Render's MongoDB service
   - Any other MongoDB hosting service

2. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Deployment Steps

### 1. Prepare Your Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `university-ai-chat` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose based on your needs (Free tier available)

### 3. Set Environment Variables

In your Render service dashboard, go to "Environment" tab and add:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/university-ai-chat?retryWrites=true&w=majority
OPENAI_API_KEY=sk-your-actual-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

**Important Notes:**
- Replace `MONGODB_URI` with your actual MongoDB connection string
- Replace `OPENAI_API_KEY` with your actual OpenAI API key
- Render automatically sets `PORT` to 10000, but it's good to be explicit

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Install dependencies
   - Build the frontend
   - Start the server
3. Your app will be available at the provided URL

## Alternative: Using render.yaml

If you prefer configuration as code, you can use the included `render.yaml` file:

1. Make sure `render.yaml` is in your repository root
2. When creating the service, Render will automatically detect and use the configuration

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Server port | No | `10000` (Render default) |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb+srv://...` |
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-...` |
| `OPENAI_MODEL` | OpenAI model to use | No | `gpt-4o-mini` |

## Troubleshooting

### Common Issues

1. **Build Fails**: Check that all dependencies are properly listed in package.json
2. **Database Connection Error**: Verify your MongoDB URI is correct and accessible
3. **OpenAI API Error**: Ensure your API key is valid and has sufficient credits
4. **Static Files Not Loading**: Make sure the build process completed successfully

### Logs

Check the Render service logs for detailed error information:
1. Go to your service dashboard
2. Click on "Logs" tab
3. Look for error messages or warnings

## Local Development

To run locally with the same configuration:

1. Copy `env.example` to `.env` in the server directory
2. Fill in your actual values
3. Run `npm run dev` from the root directory

## Production Considerations

1. **Database**: Use a managed MongoDB service like MongoDB Atlas
2. **API Keys**: Never commit API keys to version control
3. **Monitoring**: Consider adding logging and monitoring services
4. **Scaling**: Upgrade your Render plan if you need more resources
5. **Custom Domain**: Configure a custom domain in Render settings

## Support

If you encounter issues:
1. Check the Render documentation
2. Review the service logs
3. Verify all environment variables are set correctly
4. Test your MongoDB and OpenAI connections
