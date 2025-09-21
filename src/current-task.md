our goal is to rewrite this file considering the new informations that we have

we can intercept copilot chat logs.
i filtered out somme that look intereseting, you can find them in the currently open file.

now its time to analyze them and see what we can extract from them.
the logs are from two different models, Gemini 2.5 Flash and GPT-4.1.
there are some differences in how internal models responses are procesed and how Gemini responses are processed.
Chat GPT requests logs come from using the free tier of copilot and they seem to stream back eachh token separatly. this is good for out token count metric
, but it makes it hard to extract the model name, as it is only present in the initial request log.
Gemini logs on the other hand seem to stream back chunks of text, not single tokens.
This makes it easier to extract the model name, but harder to count tokens.
We should try to extract the model name from the initial request log for GPT-4.1 and then count tokens based on the streamed tokens.
We should also consider the finish reason for each response, as it can indicate whether the response was completed successfully or if there was an error or interruption.
This information can be useful for monitoring the reliability of the models and identifying any potential issues.

Your task is to rewrite the file src/copilotMonitor.ts to implement these changes.
The final goal is to sent metrics to a local prometheus endpoint, so we can visualize them in grafana.
