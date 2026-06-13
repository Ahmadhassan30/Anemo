import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  lectureVideoUploader: f({ video: { maxFileSize: "2GB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user || (session.user as any).role !== "professor") {
        throw new Error("Unauthorized");
      }
      return { userId: (session.user as any).id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // file.url is the public CDN URL of the uploaded video
      // Return it so the client can save it
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
