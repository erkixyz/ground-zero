import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

const mockMailer = {
  sendMail: jest.fn(),
};

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailer },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  describe('sendWelcome', () => {
    it('sends welcome email with correct template', async () => {
      mockMailer.sendMail.mockResolvedValue(undefined);

      await service.sendWelcome({ firstName: 'Erki', email: 'erki@test.ee' });

      expect(mockMailer.sendMail).toHaveBeenCalledWith({
        to: 'erki@test.ee',
        subject: "Tere tulemast Ground Zero'sse",
        template: 'welcome',
        context: { firstName: 'Erki' },
      });
    });
  });

  describe('sendPasswordReset', () => {
    it('sends reset email with correct link', async () => {
      mockMailer.sendMail.mockResolvedValue(undefined);
      process.env.APP_URL = 'http://localhost:3000';

      await service.sendPasswordReset('erki@test.ee', 'reset-token-123');

      expect(mockMailer.sendMail).toHaveBeenCalledWith({
        to: 'erki@test.ee',
        subject: 'Parooli lähtestamine — Ground Zero',
        template: 'reset-password',
        context: { resetLink: 'http://localhost:3000/reset-password?token=reset-token-123' },
      });
    });
  });

  describe('sendNoteCreated', () => {
    it('sends note created notification', async () => {
      mockMailer.sendMail.mockResolvedValue(undefined);

      await service.sendNoteCreated(
        { email: 'erki@test.ee', firstName: 'Erki' },
        { title: 'Minu märge' },
      );

      expect(mockMailer.sendMail).toHaveBeenCalledWith({
        to: 'erki@test.ee',
        subject: 'Märge loodud: Minu märge',
        template: 'note-created',
        context: { firstName: 'Erki', title: 'Minu märge' },
      });
    });
  });

  describe('sendEmailVerification', () => {
    it('sends verification email with html link', async () => {
      mockMailer.sendMail.mockResolvedValue(undefined);

      await service.sendEmailVerification('erki@test.ee', 'https://verify.url/token');

      const call = mockMailer.sendMail.mock.calls[0][0];
      expect(call.to).toBe('erki@test.ee');
      expect(call.subject).toBe('Kinnita oma e-posti aadress — Ground Zero');
      expect(call.html).toContain('https://verify.url/token');
    });
  });

  describe('sendNote', () => {
    it('sends note with author and attachments', async () => {
      mockMailer.sendMail.mockResolvedValue(undefined);
      const note = {
        title: 'Jagatud märge',
        content: 'Sisu tekst',
        category: 'too',
        author: { firstName: 'Erki', lastName: 'K' },
      };
      const attachments = [
        { filename: 'doc.pdf', content: Buffer.from('pdf'), contentType: 'application/pdf' },
      ];

      await service.sendNote('saaja@test.ee', note, attachments);

      expect(mockMailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'saaja@test.ee',
          subject: 'Märge: Jagatud märge',
          template: 'note-share',
          context: expect.objectContaining({
            title: 'Jagatud märge',
            author: 'Erki K',
            hasAttachments: true,
            attachmentCount: 1,
          }),
          attachments: [
            expect.objectContaining({ filename: 'doc.pdf', contentType: 'application/pdf' }),
          ],
        }),
      );
    });

    it('uses Anonüümne when author is null', async () => {
      mockMailer.sendMail.mockResolvedValue(undefined);
      const note = { title: 'T', content: 'S', category: null, author: null };

      await service.sendNote('saaja@test.ee', note, []);

      const call = mockMailer.sendMail.mock.calls[0][0];
      expect(call.context.author).toBe('Anonüümne');
      expect(call.context.hasAttachments).toBe(false);
    });
  });
});
