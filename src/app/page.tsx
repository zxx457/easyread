"use client";

import { useAtomValue } from "jotai";
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  Building2Icon,
  CircleDollarSignIcon,
  HelpCircleIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Children, FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import Logo from "@/components/app/app-logo";
import { fetchSession, login } from "@/lib/api/users";
import { cn } from "@/lib/utils";
import { isMaxMdScreenAtom } from "@/stores/responsive";

function Header({ onAuthAction }: { onAuthAction: () => void }) {
  return (
    <header className="bg-secondary text-secondary-foreground sticky top-0 z-10 flex h-[var(--header-height)] items-center gap-8 px-8">
      <Logo />
      <nav className="flex items-center gap-4 max-md:hidden">
        <Button asChild variant="link" className="p-0 text-current">
          <Link href="#about-us">About</Link>
        </Button>
        <Button asChild variant="link" className="p-0 text-current">
          <Link href="#features">Features</Link>
        </Button>
        <Button asChild variant="link" className="p-0 text-current">
          <Link href="#use-cases">Solutions</Link>
        </Button>
        <Button asChild variant="link" className="p-0 text-current">
          <Link href="#pricing">Pricing</Link>
        </Button>
      </nav>
      <Button variant="outline" className="ml-auto bg-transparent font-semibold" onClick={onAuthAction}>
        Sign In
      </Button>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground flex flex-col items-center gap-4 px-8 py-8 text-center text-sm">
      <p>© {new Date().getFullYear()} Easy Read Document Generator</p>
      <p className="text-muted-foreground max-w-2xl text-center text-sm">
        This website is a mockup UI desig for Intelife's Easy Read Document Generator. All images shown are placeholders
        for demonstration only and will be replaced in the final product.
      </p>
      <a href="https://github.com/rockruff/easyread" target="_blank" rel="noopener noreferrer" className="underline">
        View on GitHub
      </a>
    </footer>
  );
}

function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className="relative border-b">
      <div id={id} className="absolute top-[calc(-1*var(--header-height))]"></div>
      <div className="absolute inset-0">{/* Background Container */}</div>
      <div className="relative flex min-h-[var(--page-height)] flex-col justify-center px-8 py-16">
        <div className={cn("mx-auto flex max-w-5xl flex-col items-center gap-8", className)}>{children}</div>
      </div>
    </section>
  );
}

function CardGroup({ children }: { children: React.ReactNode }) {
  const isMobileMode = useAtomValue(isMaxMdScreenAtom);

  if (isMobileMode) {
    return <div className="grid w-full gap-4 sm:grid-cols-2">{children}</div>;
  }

  return (
    <div className="w-full px-12">
      <Carousel opts={{ watchDrag: false }}>
        <CarouselContent className="p-1">
          {Children.map(children, (child) => (
            <CarouselItem className="flex basis-1/3">{child}</CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

function CardItem({ title, text, image }: { title: string; text: string; image: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border">
      <img src={image} alt={title} className="aspect-16/9 object-cover" />
      <div className="flex flex-col justify-center gap-4 p-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{text}</p>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  useEffect(() => {
    fetchSession()
      .then(setIsAuthenticated)
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthChecked(true));
  }, []);

  const handleDashboardAction = () => {
    if (!isAuthChecked) return;
    if (isAuthenticated) {
      router.push("/docs");
      return;
    }
    setIsLoginOpen(true);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoginSubmitting(true);
    try {
      await login({ email, password });
      setIsAuthenticated(true);
      setIsLoginOpen(false);
      toast.success("Logged in successfully");
      router.push("/docs");
      router.refresh();
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  return (
    <>
      <Header onAuthAction={handleDashboardAction} />

      <Section>
        <div className="bg-background text-foreground flex items-center gap-2 rounded-full border px-4 py-2">
          <SparklesIcon className="size-4" />
          <span className="text-sm">AI-Powered Easy Read</span>
        </div>
        <h1 className="text-center text-4xl font-bold">Turn Any Document into an Easy Read Version</h1>
        <p className="text-muted-foreground text-center">
          Easy Read is an accessibility standard that makes information clear and understandable through simple language
          and supportive visuals. Our generator uses AI to automatically transform your documents into Easy Read
          versions — accurate, fast, and inclusive.
        </p>
        <Button className="h-16 py-0 has-[>svg]:px-8" onClick={handleDashboardAction} disabled={!isAuthChecked}>
          <span className="text-lg font-bold">Get Started</span>
          <ArrowRightIcon />
        </Button>
        <Button asChild variant="link" className="text-muted-foreground h-fit p-0 underline">
          <Link href="#about-easy-read">Learn About Easy Read</Link>
        </Button>
      </Section>

      <Section id="about-easy-read">
        <div className="flex items-center gap-4 max-md:flex-col">
          <HelpCircleIcon />
          <h2 className="text-center text-2xl font-bold">Why Easy Read</h2>
        </div>
        <p className="text-muted-foreground text-center">
          Easy Read is a recognised standard designed to make complex information accessible. It uses short sentences,
          plain words, and supportive visuals to ensure that everyone — including people with learning disabilities,
          cognitive challenges, or lower literacy — can understand important content.
        </p>
        <CardGroup>
          <CardItem
            title="Accessibility Standard"
            text="Based on an international communication approach, Easy Read ensures information is equally available to all."
            image="http://static.photos/people/640x360/101"
          />
          <CardItem
            title="Support for Learning Needs"
            text="Provides clarity and structure for readers with dyslexia, ADHD, autism, or cognitive challenges."
            image="http://static.photos/education/640x360/102"
          />
          <CardItem
            title="Engaging and Clear"
            text="Short sentences, simple wording, and visual support help maintain focus and improve understanding."
            image="http://static.photos/office/640x360/103"
          />
          <CardItem
            title="Benefit for All"
            text="Even fluent readers save time and reduce stress when content is written in clear, easy-to-read form."
            image="http://static.photos/technology/640x360/104"
          />
        </CardGroup>
      </Section>

      <Section id="features">
        <div className="flex items-center gap-4 max-md:flex-col">
          <BookOpenCheckIcon />
          <h2 className="text-center text-2xl font-bold">What Our Generator Does</h2>
        </div>
        <p className="text-muted-foreground text-center">
          Our product combines the Easy Read standard with AI-powered automation. It analyses your documents and
          produces Easy Read versions that meet accessibility needs without manual rewriting.
        </p>
        <CardGroup>
          <CardItem
            title="Automatic Summaries"
            text="Finds the key points in long or complex text and presents them clearly."
            image="http://static.photos/workspace/640x360/105"
          />
          <CardItem
            title="Simplified Language"
            text="Transforms technical or complex wording into clear, everyday language."
            image="http://static.photos/education/640x360/109"
          />
          <CardItem
            title="Visual Support"
            text="Adds helpful images and icons to reinforce meaning and improve memory."
            image="http://static.photos/abstract/640x360/107"
          />
          <CardItem
            title="Ready to Share"
            text="Generates Easy Read documents that meet accessibility guidelines and are instantly usable."
            image="http://static.photos/technology/640x360/108"
          />
        </CardGroup>
      </Section>

      <Section id="use-cases">
        <div className="flex items-center gap-4 max-md:flex-col">
          <Building2Icon />
          <h2 className="text-center text-2xl font-bold">Solutions for Every Sector</h2>
        </div>
        <p className="text-muted-foreground text-center">
          Our generator makes it easy for organisations across industries to meet accessibility standards and
          communicate clearly with diverse audiences.
        </p>
        <CardGroup>
          <CardItem
            title="Healthcare"
            text="Convert medical instructions, letters, and consent forms into Easy Read so patients can understand their care."
            image="http://static.photos/medical/640x360/109"
          />
          <CardItem
            title="Education"
            text="Make textbooks, research, and course materials accessible and easier to study."
            image="http://static.photos/education/640x360/110"
          />
          <CardItem
            title="Government & Services"
            text="Ensure policies, benefits, and forms meet Easy Read standards so all citizens can use them."
            image="http://static.photos/cityscape/640x360/111"
          />
          <CardItem
            title="Workplace"
            text="Help employees quickly grasp reports, training materials, and compliance documents."
            image="http://static.photos/office/640x360/112"
          />
          <CardItem
            title="Community Organizations"
            text="Provide inclusive communication for people with different literacy levels or language needs."
            image="http://static.photos/people/640x360/113"
          />
        </CardGroup>
      </Section>

      <Section id="pricing">
        <div className="flex items-center gap-4 max-md:flex-col">
          <CircleDollarSignIcon />
          <h2 className="text-center text-2xl font-bold">Pricing</h2>
        </div>
        <p className="text-muted-foreground text-center">
          Simple token-based pricing. Pre-purchase tokens and pay only for what you use. No subscriptions, no hidden
          fees — and tokens stay in your account until you need them.
        </p>
        <div className="flex w-full gap-4 max-md:flex-col md:[&>*]:basis-1/3">
          <div className="flex flex-col gap-4 rounded-xl border p-8">
            <h3 className="text-center text-lg font-bold">Starter Pack</h3>
            <p className="text-center text-3xl font-bold">$10</p>
            <p className="text-muted-foreground text-center">1,000 tokens</p>
            <ul className="text-muted-foreground my-4 list-inside list-disc space-y-1 text-left text-sm">
              <li>Pay as you go</li>
              <li>Good for short documents</li>
              <li>Email support</li>
            </ul>
            <Button asChild className="w-full">
              <Link href="/settings">Buy Tokens</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border p-8">
            <h3 className="text-center text-lg font-bold">Professional</h3>
            <p className="text-center text-3xl font-bold">$50</p>
            <p className="text-muted-foreground text-center">6,000 tokens</p>
            <ul className="text-muted-foreground my-4 list-inside list-disc space-y-1 text-left text-sm">
              <li>Better value per token</li>
              <li>Handle long documents</li>
              <li>Priority support</li>
            </ul>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/settings">Buy Tokens</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border p-8">
            <h3 className="text-center text-lg font-bold">Enterprise</h3>
            <p className="text-center text-3xl font-bold">Custom</p>
            <p className="text-muted-foreground text-center">High-volume tokens</p>
            <ul className="text-muted-foreground my-4 list-inside list-disc space-y-1 text-left text-sm">
              <li>Lowest token rates</li>
              <li>Designed for heavy usage</li>
              <li>Dedicated support</li>
            </ul>
            <Button asChild variant="secondary" className="w-full">
              <Link href="mailto:name@example.com">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section id="about-us">
        <div className="flex items-center gap-4 max-md:flex-col">
          <SparklesIcon />
          <h2 className="text-center text-2xl font-bold">About Us</h2>
        </div>
        <p className="text-muted-foreground text-center">
          Easy Read Document Generator is a product by Intelife — a social enterprise based in Western Australia.
          Intelife is committed to empowering individuals with disabilities to live a life of purpose, enjoyment, and
          independence.{" "}
          <a href="https://intelife.org/about/" target="_blank" rel="noopener noreferrer" className="underline">
            Learn more
          </a>
        </p>
        <p className="text-muted-foreground text-center">
          Founded in 1991 by a group of families seeking better opportunities for their children, Intelife began with a
          small team and has grown to provide employment services, life skills programs, and community access. Today,
          Intelife supports more than 650 individuals across Perth and the South West.{" "}
          <a href="https://intelife.org/about/" target="_blank" rel="noopener noreferrer" className="underline">
            Read our story
          </a>
        </p>
        <p className="text-muted-foreground text-center">
          As a registered NDIS provider, Intelife works within national frameworks to deliver outcome-based support for
          people with disabilities.{" "}
          <a
            href="https://intelife.org/about/funding-ndis/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            About NDIS funding
          </a>
        </p>
      </Section>

      <Section>
        <h2 className="text-center text-3xl font-bold">Start Generating Easy Read Documents Today</h2>
        <p className="text-muted-foreground text-center">
          Use AI to create Easy Read versions of your documents in minutes — compliant with standards, clear, and ready
          to share.
        </p>
        <Button className="h-16 py-0 has-[>svg]:px-8" onClick={handleDashboardAction} disabled={!isAuthChecked}>
          <span className="text-lg font-bold">Try It Now</span>
          <ArrowRightIcon />
        </Button>
      </Section>

      <Footer />

      <Dialog
        open={isLoginOpen}
        onOpenChange={(open) => {
          setIsLoginOpen(open);
          if (!open) {
            setPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
            <DialogDescription>
              Use your account to access the dashboard. Demo credentials: jane.doe@uwa.edu.au / password123
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
              />
            </div>
            <Button type="submit" disabled={isLoginSubmitting}>
              {isLoginSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
