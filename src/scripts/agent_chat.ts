import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { storeObservation, recallContext } from '../services/observations.js';
import { TenantContext } from '../db/schema.js';
import { env } from '../config/env.js';

const tenant: TenantContext = {
  orgId: env.DEFAULT_ORG_ID,
  userId: env.DEFAULT_USER_ID,
};

async function main() {
  const rl = readline.createInterface({ input, output });

  console.clear();
  console.log('======================================================================');
  console.log('🧠 ExtenGen Live Multi-Agent Cognitive Bus');
  console.log('   Real Database: Supabase PostgreSQL (pgvector HNSW)');
  console.log('   Real Embeddings: Google Gemini gemini-embedding-001 (768d)');
  console.log(`   Tenant Org ID: ${tenant.orgId}`);
  console.log('======================================================================\n');
  console.log('Aap yahan real dynamic demands test kar sakte hain (0% hardcoded).');
  console.log('Agent 1 (Alice - Writer) koi bhi nayi baat save karegi.');
  console.log('Agent 2 (Bob - Reader) us memory ko bina kisi session context ke recall karega.\n');

  while (true) {
    console.log('----------------------------------------------------------------------');
    console.log('CHOOSE ACTION:');
    console.log('1) [Agent 1 - Alice]: Store an architectural rule / decision into DB');
    console.log('2) [Agent 2 - Bob]: Ask a question and recall Agent 1\'s decision');
    console.log('3) Exit');
    console.log('----------------------------------------------------------------------');

    const choice = (await rl.question('Enter choice (1, 2, or 3): ')).trim();

    if (choice === '1') {
      console.log('\n--- 📝 [AGENT 1: ALICE] CAPTURE MODE ---');
      const title = (await rl.question('Rule Title (e.g., Payment Gateway Standard): ')).trim();
      const content = (await rl.question('Rule Content / Decision (e.g., We use Razorpay with webhook HMAC-SHA256): ')).trim();

      if (!content) {
        console.log('⚠️ Content cannot be empty. Cancelled.\n');
        continue;
      }

      console.log('\n⏳ Generating 768d vector embedding & saving to Supabase PostgreSQL...');
      try {
        const obs = await storeObservation(tenant, {
          title: title || 'Architectural Decision',
          content,
          source: 'agent_session',
          tags: ['architecture', 'live-test'],
          immediateEmbed: true,
          metadata: {
            agent_name: 'Agent 1 (Alice CLI)',
            timestamp: new Date().toISOString(),
          }
        });

        console.log('✅ Stored Successfully in pgvector!');
        console.log(`   ID: ${obs.id}`);
        console.log(`   Status: ${obs.status}`);
        console.log(`   Title: ${obs.title}`);
        console.log(`   Vector Dimensions: 768d`);
        console.log(`   Content: "${obs.content}"\n`);
      } catch (err: any) {
        console.error('❌ Failed to store observation:', err.message, '\n');
      }

    } else if (choice === '2') {
      console.log('\n--- 🔍 [AGENT 2: BOB] RECALL MODE ---');
      console.log('Notice: Bob has a brand-new session with 0 local chat memory.');
      const query = (await rl.question('Ask Bob any question: ')).trim();

      if (!query) {
        console.log('⚠️ Query cannot be empty. Cancelled.\n');
        continue;
      }

      console.log(`\n⏳ Querying pgvector HNSW index for: "${query}"...`);
      try {
        const recall = await recallContext(tenant, {
          query,
          limit: 3,
          similarityThreshold: 0.15,
        });

        if (recall.matchesCount === 0 || recall.observations.length === 0) {
          console.log('⚠️ No matching memories found in ExtenGen for this query.');
          console.log('   (Try asking with terms related to what Agent 1 stored, or lower threshold).\n');
        } else {
          console.log(`🎯 Found ${recall.matchesCount} matching memory chunk(s) from Agent 1!\n`);

          recall.observations.forEach((match, idx) => {
            const simPct = (match.similarity * 100).toFixed(1);
            console.log(`   [Match #${idx + 1}] Relevance: ${simPct}% | Source: ${match.source}`);
            console.log(`   Title: ${match.title}`);
            console.log(`   Content: "${match.content}"`);
            console.log(`   ID: ${match.id}\n`);
          });

          console.log('🤖 [Agent 2 - Synthesized Answer Injected with Memory]:');
          const top = recall.observations[0];
          console.log(`   "Based on our team's established standard [${top.title}],`);
          console.log(`    we follow: ${top.content}"\n`);
        }
      } catch (err: any) {
        console.error('❌ Failed to recall context:', err.message, '\n');
      }

    } else if (choice === '3') {
      console.log('👋 Goodbye!');
      rl.close();
      break;
    } else {
      console.log('Invalid option, please choose 1, 2, or 3.\n');
    }
  }
}

main().catch((err) => {
  console.error('Fatal error in agent chat:', err);
  process.exit(1);
});

