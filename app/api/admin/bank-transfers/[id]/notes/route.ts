import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import TransferNote                 from '@/models/TransferNote';
import User                         from '@/models/User';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';
import mongoose                     from 'mongoose';

// ── POST /api/admin/bank-transfers/[id]/notes ─────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid order ID.' }, { status: 400 });
  }

  const { content } = (await req.json()) as { content?: string };
  if (!content?.trim()) {
    return NextResponse.json<ApiResponse>({ error: 'Note content is required.' }, { status: 400 });
  }

  try {
    await connectDB();
    const adminDoc = await User.findById(admin.userId).select('firstName lastName').lean() as
      { firstName: string; lastName: string } | null;
    const adminName = adminDoc ? `${adminDoc.firstName} ${adminDoc.lastName}` : 'Admin';

    const note = await TransferNote.create({
      orderId:   id,
      adminId:   admin.userId,
      adminName,
      content:   content.trim(),
    });

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data: {
        _id:       (note._id as { toString(): string }).toString(),
        adminId:   admin.userId,
        adminName,
        content:   note.content,
        createdAt: note.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/bank-transfers/[id]/notes]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/admin/bank-transfers/[id]/notes ───────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { noteId } = (await req.json()) as { noteId?: string };

  if (!noteId || !mongoose.isValidObjectId(noteId)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid note ID.' }, { status: 400 });
  }

  try {
    await connectDB();
    // Only the author or a superadmin can delete
    const filter =
      admin.role === 'superadmin'
        ? { _id: noteId, orderId: id }
        : { _id: noteId, orderId: id, adminId: admin.userId };

    const deleted = await TransferNote.findOneAndDelete(filter);
    if (!deleted) {
      return NextResponse.json<ApiResponse>({ error: 'Note not found or not authorized.' }, { status: 404 });
    }
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/bank-transfers/[id]/notes]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
