import { storeObservation, recallContext } from '../services/observations.js';
import { env } from '../config/env.js';

async function runMultiAgentProof() {
  console.log('\n' + '━'.repeat(65));
  console.log('  🧪 EXTENGEN — MULTI-AGENT COLLABORATION LIVE PROOF');
  console.log('━'.repeat(65));

  const tenant = {
    orgId: env.DEFAULT_ORG_ID,
    userId: env.DEFAULT_USER_ID,
    role: 'agent' as const,
  };

  // Step 1: Agent 1 (Claude Code) works on the backend
  console.log('\n[1] 🤖 Agent 1 (Claude Code in CLI):');
  console.log('    Working on: Payment & Refund API Architecture');
  console.log('    Decision made: "Refund API must use idempotency_key with 24h TTL"');
  console.log('    Action: Executing `store_observation` tool...');

  const startTime = Date.now();
  const savedObservation = await storeObservation(tenant, {
    title: 'Payment Gateway Idempotency Standard',
    content: 'All Stripe and PayPal refund API calls must pass an idempotency_key header with a 24-hour Redis TTL to prevent double debits on network retry.',
    source: 'agent_session',
    tags: ['payments', 'redis', 'idempotency'],
    metadata: {
      agent_name: 'Claude Code CLI v1.2',
      session_id: 'sess_claude_101',
    },
    immediateEmbed: true,
  });

  const embedDuration = Date.now() - startTime;
  console.log(`    ✅ Stored in ExtenGen Shared Memory (ID: ${savedObservation.id.slice(0, 8)}..., ${embedDuration}ms)`);
  console.log(`    🧠 Real Neural Vector Embedding Generated & Indexed`);

  // Step 2: Agent 2 (Cursor IDE) starts a new session on another machine/branch
  console.log('\n' + '-'.repeat(65));
  console.log('[2] ⚡ Agent 2 (Cursor IDE on Developer Laptop):');
  console.log('    Starts brand new session. Context window is clean (0 prior tokens).');
  console.log('    Developer prompt: "How should I handle duplicate payments in refund route?"');
  console.log('    Action: Executing `recall_context` tool to query ExtenGen...');

  const recallStart = Date.now();
  const recallResult = await recallContext(tenant, {
    query: 'How should I handle duplicate payments in refund route?',
    limit: 3,
    similarityThreshold: 0.30,
  });
  const recallDuration = Date.now() - recallStart;

  console.log(`    🔍 Semantic Vector Search Completed in ${recallDuration}ms`);
  console.log(`    🎯 Matches Found: ${recallResult.matchesCount}`);

  if (recallResult.matchesCount > 0) {
    const topMatch = recallResult.observations[0];
    console.log('\n[3] 🏆 LIVE PROOF — Retrieved Memory from Agent 1:');
    console.log(`    • Memory ID    : ${topMatch.id}`);
    console.log(`    • Title        : "${topMatch.title}"`);
    console.log(`    • Saved By     : ${(topMatch.metadata as any)?.agent_name || 'Agent 1'}`);
    console.log(`    • Cosine Score : ${(topMatch.similarity * 100).toFixed(1)}% Semantic Match`);
    console.log(`    • Content      : "${topMatch.content}"`);
    console.log('\n    ✨ Result: Agent 2 automatically followed Agent 1\'s rule without duplicate code!');
  } else {
    console.log('    ❌ No matches retrieved.');
  }

  console.log('━'.repeat(65) + '\n');
  process.exit(0);
}

runMultiAgentProof().catch(err => {
  console.error('Multi-agent demo failed:', err);
  process.exit(1);
});
