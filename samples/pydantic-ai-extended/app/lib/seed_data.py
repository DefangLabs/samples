"""Deterministic fallback seed data used when LLM is unavailable or LOCAL_FAST_DATA is enabled."""

from __future__ import annotations

from lib.items import RawItemSeed

fallback_tickets: list[RawItemSeed] = [
    RawItemSeed(
        item_type="ticket",
        source="Zendesk",
        title="Cannot reset password after email change",
        body="Customer changed their email address last week and now the password reset flow sends the link to the old email. They've tried clearing cookies and using incognito mode.",
        status="open",
        assignee="Maya Chen",
    ),
    RawItemSeed(
        item_type="ticket",
        source="GitHub Issues",
        title="SDK returns 403 after token refresh",
        body="The Python SDK throws a 403 Forbidden error immediately after refreshing the access token. This started after upgrading to v2.4.0. Rolling back to v2.3.1 fixes it.",
        status="open",
        assignee="Alex Rivera",
    ),
    RawItemSeed(
        item_type="ticket",
        source="Intercom",
        title="Billing page shows wrong subscription tier",
        body="Enterprise customer reports their billing page shows the Pro tier instead of Enterprise. They're being charged correctly according to Stripe, but the UI is wrong.",
        status="in progress",
        assignee="Jordan Lee",
    ),
    RawItemSeed(
        item_type="ticket",
        source="Jira",
        title="CSV export times out for large datasets",
        body="Exporting more than 50k rows as CSV causes a gateway timeout. The export job runs for over 5 minutes before nginx kills the connection.",
        status="open",
        assignee="Sam Patel",
    ),
    RawItemSeed(
        item_type="ticket",
        source="Linear",
        title="Webhook delivery fails silently for deleted endpoints",
        body="When a webhook endpoint is deleted, pending deliveries fail without any error in the dashboard. Users expect to see failed delivery attempts in the logs.",
        status="planned",
        assignee="Maya Chen",
    ),
    RawItemSeed(
        item_type="ticket",
        source="Zendesk",
        title="SSO login loop on Safari",
        body="Safari users get stuck in an infinite redirect loop when trying to sign in via SSO. Works fine on Chrome and Firefox. Likely related to ITP cookie restrictions.",
        status="open",
        assignee="Alex Rivera",
    ),
    RawItemSeed(
        item_type="ticket",
        source="Slack",
        title="Dashboard charts render blank after timezone change",
        body="After switching the account timezone from UTC to PST, all dashboard charts show blank. Refreshing the page and clearing cache doesn't help.",
        status="open",
        assignee="Jordan Lee",
    ),
    RawItemSeed(
        item_type="ticket",
        source="GitHub Issues",
        title="Rate limiter counts preflight OPTIONS requests",
        body="CORS preflight OPTIONS requests are being counted against the API rate limit. This causes legitimate POST requests to fail for browser-based clients.",
        status="in progress",
        assignee="Sam Patel",
    ),
    RawItemSeed(
        item_type="ticket",
        source="Intercom",
        title="File uploads fail above 25MB even though limit is 100MB",
        body="The file upload endpoint returns a 413 error for files above 25MB. The docs say the limit is 100MB. The load balancer might have a lower limit configured.",
        status="blocked",
        assignee="Alex Rivera",
    ),
    RawItemSeed(
        item_type="ticket",
        source="Linear",
        title="Search indexing lags behind by 10+ minutes",
        body="Newly created records don't appear in search results for at least 10 minutes. The search index job seems to be running on a fixed schedule rather than processing events in real time.",
        status="planned",
        assignee="Maya Chen",
    ),
]

fallback_alerts: list[RawItemSeed] = [
    RawItemSeed(
        item_type="alert",
        source="Datadog",
        title="API p99 latency above 2s for 15 minutes",
        body="The /api/v2/search endpoint p99 latency has been above 2 seconds for the last 15 minutes. Normal baseline is 400ms. The database connection pool is at 95% utilization.",
    ),
    RawItemSeed(
        item_type="alert",
        source="PagerDuty",
        title="Payment processing service unresponsive",
        body="Health checks for the payment service have been failing for 3 minutes. Last successful transaction was at 14:32 UTC. Stripe webhook deliveries are queuing up.",
    ),
    RawItemSeed(
        item_type="alert",
        source="Sentry",
        title="Unhandled TypeError in checkout flow",
        body="TypeError: Cannot read properties of undefined (reading 'price') at CheckoutPage.calculateTotal. 847 occurrences in the last hour affecting 312 users.",
    ),
    RawItemSeed(
        item_type="alert",
        source="GitHub Actions",
        title="Deploy to production failed: image pull error",
        body="The production deploy workflow failed at the image pull step. The container registry returned a 429 Too Many Requests error. Three retries all failed.",
    ),
    RawItemSeed(
        item_type="alert",
        source="Vercel",
        title="Edge function cold start times elevated",
        body="Cold start times for edge functions in the us-east-1 region are 3x higher than normal. Warm function performance is unaffected. Vercel status page shows no incidents.",
    ),
    RawItemSeed(
        item_type="alert",
        source="Stripe",
        title="Webhook signature verification failures spike",
        body="43 webhook signature verification failures in the last 30 minutes. All are for the invoice.payment_succeeded event type. The signing secret may have been rotated.",
    ),
    RawItemSeed(
        item_type="alert",
        source="Datadog",
        title="Redis memory usage at 89% of max",
        body="The production Redis instance memory usage has been climbing steadily and is now at 89% of the configured maxmemory. Key eviction has started.",
    ),
    RawItemSeed(
        item_type="alert",
        source="Sentry",
        title="Rate of 500 errors doubled in the last hour",
        body="Internal server errors across all API endpoints have increased from a baseline of ~20/min to ~45/min. No recent deploys. The error distribution is spread across multiple endpoints.",
    ),
    RawItemSeed(
        item_type="alert",
        source="AWS CloudWatch",
        title="RDS connection count approaching limit",
        body="The RDS instance has 180 active connections out of a maximum 200. This is the highest it has been in 30 days. Several connection pool warnings in the application logs.",
    ),
    RawItemSeed(
        item_type="alert",
        source="PagerDuty",
        title="Certificate expiry warning: api.example.com",
        body="The TLS certificate for api.example.com expires in 7 days. Auto-renewal via Let's Encrypt failed with a DNS challenge verification error.",
    ),
]
