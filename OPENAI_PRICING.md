# OpenAI Pricing Guide for My Aura Log

## 💰 Cost Breakdown

### Model: `gpt-4o-mini`
- **Input:** $0.150 per 1 million tokens
- **Output:** $0.600 per 1 million tokens
- **Max tokens per request:** 200 (as configured)

## 📊 Cost Per Journal Entry

### Typical Journal Entry Calculation:

**Input tokens:**
- System prompt: ~50 tokens
- User journal entry: ~50-200 tokens (average 100)
- **Total input:** ~150 tokens

**Output tokens:**
- AI response (JSON): ~80-120 tokens
- **Max output:** 200 tokens (your limit)

### Cost Per Entry:
- **Input:** 150 tokens × $0.150/1M = **$0.0000225**
- **Output:** 100 tokens × $0.600/1M = **$0.00006**
- **Total per entry:** ~**$0.00008** (less than 1 cent!)

## 💵 Recommended Starting Amount

### For Personal Use / Testing:
- **$5 - $10** ✅
- Good for: 60,000 - 125,000 journal entries
- Lasts: Months of personal use

### For Small App Launch (100 users):
- **$20 - $50** ✅
- Good for: 250,000 - 625,000 journal entries
- If users journal daily: ~8-20 months of usage

### For Medium Scale (1,000 users):
- **$100 - $200** ✅
- Good for: 1.25M - 2.5M journal entries
- If users journal daily: ~3-7 months of usage

## 📈 Monthly Cost Estimates

### Scenario 1: Light Usage
- 1 user, 30 entries/month
- **Cost:** $0.0024/month (less than 1 cent!)

### Scenario 2: Moderate Usage
- 100 users, 30 entries/month each = 3,000 entries
- **Cost:** $0.24/month (less than 25 cents!)

### Scenario 3: Active Usage
- 1,000 users, 30 entries/month each = 30,000 entries
- **Cost:** $2.40/month (less than $2.50!)

### Scenario 4: Heavy Usage
- 10,000 users, 30 entries/month each = 300,000 entries
- **Cost:** $24/month

## 🎯 My Recommendation

### Start with: **$10 - $20**

**Why:**
- ✅ Very affordable
- ✅ Covers months of testing and personal use
- ✅ Easy to top up later
- ✅ No commitment - pay as you go
- ✅ Free tier offers $5 credits for new users

### For Production App:
- **Start:** $50
- **Monitor:** First month usage
- **Adjust:** Based on actual usage

## 💡 Cost Optimization Tips

1. **Use gpt-4o-mini** ✅ (You're already using this - cheapest option!)
2. **Set max_tokens: 200** ✅ (You're already doing this)
3. **Monitor usage** in OpenAI dashboard
4. **Set spending limits** in OpenAI dashboard
5. **Keep prompts concise** (you're already doing this)

## 🔒 Set Spending Limits

1. Go to [OpenAI Usage Limits](https://platform.openai.com/account/billing/limits)
2. Set a **hard limit** (e.g., $50/month)
3. Set **soft alerts** (e.g., alert at $25)
4. Prevents unexpected charges

## 📊 Real-World Example

**Your app with 100 active users:**
- Each user journals 3x per week
- = 12 entries per user per month
- = 1,200 total entries/month
- **Cost:** ~$0.10/month (10 cents!)

**That's incredibly cheap!** 🎉

## ⚠️ Important Notes

1. **Free Credits:** New OpenAI accounts get $5 free credits
2. **Pay-as-you-go:** Only pay for what you use
3. **No minimum:** No monthly commitment required
4. **Monitor regularly:** Check dashboard weekly initially
5. **Token usage varies:** Longer journal entries = slightly more cost

## 🚀 Bottom Line

**Start with $10-20** and you'll be set for months of development and testing!

The costs are **extremely low** - you'd need thousands of entries to even reach $1.

---

**Current Settings in Your App:**
- Model: `gpt-4o-mini` ✅ (cheapest option)
- Max tokens: 200 ✅ (efficient)
- Cost per entry: ~$0.00008 ✅ (very affordable!)

