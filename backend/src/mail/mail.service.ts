import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

export type NoteAttachment = { filename: string; content: Buffer; contentType: string };

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendWelcome(user: { firstName: string; email: string }) {
    await this.mailer.sendMail({
      to: user.email,
      subject: "Tere tulemast Ground Zero'sse",
      template: "welcome",
      context: { firstName: user.firstName },
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const resetLink = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    await this.mailer.sendMail({
      to: email,
      subject: "Parooli lähtestamine — Ground Zero",
      template: "reset-password",
      context: { resetLink },
    });
  }

  async sendNoteCreated(user: { email: string; firstName: string }, note: { title: string }) {
    await this.mailer.sendMail({
      to: user.email,
      subject: `Märge loodud: ${note.title}`,
      template: "note-created",
      context: { firstName: user.firstName, title: note.title },
    });
  }

  async sendEmailVerification(email: string, verifyUrl: string) {
    await this.mailer.sendMail({
      to: email,
      subject: "Kinnita oma e-posti aadress — Ground Zero",
      html: `
        <p>Tere,</p>
        <p>Klõpsa allolevale lingile oma e-posti aadressi kinnitamiseks:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Kui sa seda kontot ei loonud, ignoreeri seda kirja.</p>
      `,
    });
  }

  async sendNote(
    toEmail: string,
    note: {
      title: string;
      content: string;
      category: string | null;
      author: { firstName: string; lastName: string } | null;
    },
    attachments: NoteAttachment[],
  ) {
    await this.mailer.sendMail({
      to: toEmail,
      subject: `Märge: ${note.title}`,
      template: "note-share",
      context: {
        title: note.title,
        content: note.content,
        category: note.category,
        author: note.author ? `${note.author.firstName} ${note.author.lastName}` : "Anonüümne",
        hasAttachments: attachments.length > 0,
        attachmentCount: attachments.length,
      },
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
  }
}
