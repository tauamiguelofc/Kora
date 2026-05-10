#!/bin/bash
export MONGODB_URI="mongodb+srv://tauamiguel:Porta9090@database.wyivq0g.mongodb.net/?appName=Database"
export JWT_SECRET="deedbe5256de56d40c06b3b7f795731e7e0d77a0cc14e93d2ad211b281a25d10"
export NODE_ENV="development"
export APP_URL="http://localhost:3000"
npx vercel dev
