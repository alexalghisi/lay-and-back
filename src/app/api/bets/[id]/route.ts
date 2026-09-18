import { fail, ok } from "@/lib/bets/http";
import { betService } from "@/lib/bets/store";

interface Context {
    params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: Context) {
    try {
        const { id } = await context.params;
        return ok(betService.get(id));
    } catch (error) {
        return fail(error);
    }
}

export async function PATCH(request: Request, context: Context) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        return ok(betService.amend(id, body));
    } catch (error) {
        return fail(error);
    }
}

export async function DELETE(_request: Request, context: Context) {
    try {
        const { id } = await context.params;
        betService.remove(id);
        return new Response(null, { status: 204 });
    } catch (error) {
        return fail(error);
    }
}
