import Link from 'next/link';
import { GraduationCap, ShieldAlert, Landmark, Users } from 'lucide-react';

const AGENCY_URL = process.env.NEXT_PUBLIC_AGENCY_URL || 'https://askbeforeyouapp.com';

/**
 * The four doors — each entry point asks the visitor's own question.
 * Two lead into the free public directory; two lead toward the Agency (apex).
 */
type Door = {
  who: string;
  question: string;
  copy: string;
  href: string;
  external?: boolean;
  icon: React.ReactNode;
  accent: string;
};

const DOORS: Door[] = [
  {
    who: "I'm a teacher",
    question: 'Can I use this app?',
    copy: 'Search the vetted directory and read the brief before you put a video in front of a class.',
    href: '/directory',
    icon: <GraduationCap size={24} />,
    accent: 'text-signal',
  },
  {
    who: "I'm a parent",
    question: 'Is this video okay?',
    copy: 'A plain-language summary of what is in a video, and who gets your kid’s data. Free and anonymous.',
    href: '/directory',
    icon: <Users size={24} />,
    accent: 'text-signal',
  },
  {
    who: 'I run technology or privacy',
    question: 'Where are we exposed?',
    copy: 'See how the shadow-app problem plays out, then take it to the Agency for the full picture.',
    href: `${AGENCY_URL}`,
    external: true,
    icon: <ShieldAlert size={24} />,
    accent: 'text-amber',
  },
  {
    who: "I'm on a school board",
    question: 'Are we covered?',
    copy: 'Board-ready framing on student-data risk, and where the district stands.',
    href: `${AGENCY_URL}`,
    external: true,
    icon: <Landmark size={24} />,
    accent: 'text-amber',
  },
];

export function FourDoors() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" id="doors">
      <div className="mb-10">
        <span className="label text-amber">Pick your door</span>
        <h2 className="mt-2 font-mono text-2xl font-bold tracking-tight text-paper sm:text-3xl">
          Four ways in. Start with your own question.
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DOORS.map((door) => {
          const inner = (
            <>
              <span className={`${door.accent}`}>{door.icon}</span>
              <p className="mt-4 font-mono text-sm uppercase tracking-widest text-paper/50">
                {door.who}
              </p>
              <p className="mt-1 text-xl font-bold text-paper">{door.question}</p>
              <p className="mt-3 text-sm leading-relaxed text-paper/60">{door.copy}</p>
              <span className={`mt-5 inline-block font-mono text-xs uppercase tracking-widest ${door.accent}`}>
                {door.external ? 'Enter the Agency →' : 'Open the directory →'}
              </span>
            </>
          );

          const cls =
            'dossier group flex flex-col p-6 transition hover:border-amber/60 hover:shadow-dossier';

          return door.external ? (
            <a key={door.who} href={door.href} className={cls}>
              {inner}
            </a>
          ) : (
            <Link key={door.who} href={door.href} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
