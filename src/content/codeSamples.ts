/**
 * Exemples de code de la section « Pour les développeurs ».
 * Le code n'est pas traduit : il reste identique quelle que soit la langue.
 * L'URL de l'API est volontairement une variable : aucun domaine n'est inventé.
 */

export const createPaymentCurl = `curl -X POST "$PAYLANCE_API_URL/api/v1/payments" \\
  -H "Authorization: Bearer $PAYLANCE_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7" \\
  -d '{
    "amount": 25000,
    "currency": "XOF",
    "provider": "wave",
    "reference": "CMD-10482",
    "customer": { "phone": "+221770000000" },
    "description": "Commande CMD-10482"
  }'`;

export const createPaymentJs = `const response = await fetch(\`\${process.env.PAYLANCE_API_URL}/api/v1/payments\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.PAYLANCE_SECRET_KEY}\`,
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    amount: 25000,
    currency: "XOF",
    provider: "wave",
    reference: "CMD-10482",
    customer: { phone: "+221770000000" },
  }),
});

const payment = await response.json();
// payment.status === "pending"`;

export const signedWebhook = `POST /webhooks/paylance HTTP/1.1
Content-Type: application/json
Paylance-Signature: t=1794321125,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd

{
  "id": "evt_01JC8Z3F6Q",
  "type": "payment.succeeded",
  "created_at": "2026-11-10T14:32:05Z",
  "data": {
    "id": "pay_01JC8Z2K9M",
    "amount": 25000,
    "currency": "XOF",
    "provider": "wave",
    "reference": "CMD-10482",
    "status": "succeeded"
  }
}`;
