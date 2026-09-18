import { fail, ok } from "@/lib/bets/http";
import { betService } from "@/lib/bets/store";

export async function GET() {
    return ok(betService.list());
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        return ok(betService.place(body), 201);
    } catch (error) {
        return fail(error);
    }
}
