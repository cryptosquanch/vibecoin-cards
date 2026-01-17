'use client';

import Link from 'next/link';
import { Header } from '@/components/layout';
import { PlayingCard } from '@/components/design-system';

export default function HowItWorksPage() {
  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="heading-1 text-4xl md:text-5xl mb-4">
            How Vibecoin Works
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Own pieces of real apps, earn when they earn. It&apos;s that simple.
          </p>
        </div>

        {/* The Big Idea */}
        <section className="surface-panel mb-8">
          <h2 className="heading-2 mb-4">The Big Idea</h2>
          <p className="text-lg mb-4">
            Imagine if you could own a tiny piece of your favorite apps&mdash;like Spotify, Uber, or ChatGPT&mdash;and get paid whenever they make money.
          </p>
          <p className="text-muted">
            That&apos;s Vibecoin. We turn app ownership into collectible cards. When the app does well, you earn real money.
          </p>
        </section>

        {/* Step by Step */}
        <section className="mb-12">
          <h2 className="heading-2 text-center mb-8">How It Works (3 Steps)</h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="surface-panel flex gap-6 items-start">
              <div className="w-16 h-16 bg-botanical-500 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="heading-3 mb-2">Pick Apps You Believe In</h3>
                <p className="text-muted mb-3">
                  Browse our marketplace of real apps across four categories:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <span className="text-2xl text-red-500">♦</span>
                    <p className="font-medium text-sm">AI</p>
                    <p className="text-xs text-muted">AI tools & agents</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <span className="text-2xl">♠</span>
                    <p className="font-medium text-sm">DeFi</p>
                    <p className="text-xs text-muted">Financial apps</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <span className="text-2xl">♣</span>
                    <p className="font-medium text-sm">Gaming</p>
                    <p className="text-xs text-muted">Games & metaverse</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <span className="text-2xl text-red-500">♥</span>
                    <p className="font-medium text-sm">Creator</p>
                    <p className="text-xs text-muted">Creator platforms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="surface-panel flex gap-6 items-start">
              <div className="w-16 h-16 bg-botanical-500 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="heading-3 mb-2">Get Your Card</h3>
                <p className="text-muted mb-4">
                  When you invest, you get a playing card that shows your ownership. The card&apos;s rank shows how well the app is performing:
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-12">
                      <PlayingCard rank="A" suit="diamonds" size="sm" flippable={false} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Ace</p>
                      <p className="text-xs text-muted">Top performer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12">
                      <PlayingCard rank="K" suit="spades" size="sm" flippable={false} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">King</p>
                      <p className="text-xs text-muted">Excellent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12">
                      <PlayingCard rank="Q" suit="hearts" size="sm" flippable={false} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Queen</p>
                      <p className="text-xs text-muted">Great</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12">
                      <PlayingCard rank="5" suit="clubs" size="sm" flippable={false} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Number</p>
                      <p className="text-xs text-muted">Growing</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted mt-4">
                  As the app grows, your card can rank up! A 5 today could become a King tomorrow.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="surface-panel flex gap-6 items-start">
              <div className="w-16 h-16 bg-botanical-500 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="heading-3 mb-2">Earn Revenue Share</h3>
                <p className="text-muted mb-3">
                  Here&apos;s where it gets exciting. When the apps you own make money, you get a cut:
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💰</span>
                    <span className="font-semibold text-green-700">Real Money, Real Returns</span>
                  </div>
                  <ul className="text-sm text-green-800 space-y-1 ml-9">
                    <li>Apps generate revenue from users</li>
                    <li>Revenue is shared with card owners</li>
                    <li>More shares = bigger earnings</li>
                    <li>Paid out automatically to your wallet</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card Ranking Explained */}
        <section className="surface-panel mb-8">
          <h2 className="heading-2 mb-4">Understanding Card Ranks</h2>
          <p className="text-muted mb-6">
            Your card rank reflects the app&apos;s real performance. Higher ranks = better performing apps.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Rank</th>
                  <th className="text-left py-2 pr-4">Performance Score</th>
                  <th className="text-left py-2">What It Means</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-bold text-red-500">A (Ace)</td>
                  <td className="py-2 pr-4">95-100</td>
                  <td className="py-2">Elite app, crushing it</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-bold">K (King)</td>
                  <td className="py-2 pr-4">90-94</td>
                  <td className="py-2">Top tier performance</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-bold">Q (Queen)</td>
                  <td className="py-2 pr-4">85-89</td>
                  <td className="py-2">Strong and growing</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-bold">J (Jack)</td>
                  <td className="py-2 pr-4">80-84</td>
                  <td className="py-2">Solid performer</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-bold">10-6</td>
                  <td className="py-2 pr-4">30-79</td>
                  <td className="py-2">Building momentum</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold">5-2</td>
                  <td className="py-2 pr-4">0-29</td>
                  <td className="py-2">Early stage, high potential</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Battle Arena */}
        <section className="surface-panel mb-8">
          <div className="flex items-start gap-4">
            <span className="text-4xl">⚔️</span>
            <div>
              <h2 className="heading-2 mb-2">Bonus: Battle Arena</h2>
              <p className="text-muted mb-3">
                Your cards aren&apos;t just investments&mdash;they&apos;re also your battle hand!
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Challenge other investors with your portfolio
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Higher-ranked cards = stronger hands
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Win battles to earn bonus rewards
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Climb the leaderboard for bragging rights
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="heading-2 text-center mb-8">Common Questions</h2>

          <div className="space-y-4">
            <div className="surface-panel">
              <h3 className="font-semibold mb-2">Is this like stocks?</h3>
              <p className="text-muted text-sm">
                Similar idea, but better! You own a piece of apps and earn from their success. Unlike stocks, you also get a cool card that can battle other investors.
              </p>
            </div>

            <div className="surface-panel">
              <h3 className="font-semibold mb-2">How do I get paid?</h3>
              <p className="text-muted text-sm">
                Revenue is distributed automatically to your connected wallet. The more shares you own in high-performing apps, the more you earn.
              </p>
            </div>

            <div className="surface-panel">
              <h3 className="font-semibold mb-2">Can my card rank change?</h3>
              <p className="text-muted text-sm">
                Yes! Card ranks update based on app performance. If an app you invested in early takes off, your card could evolve from a 3 to a King or Ace.
              </p>
            </div>

            <div className="surface-panel">
              <h3 className="font-semibold mb-2">What blockchain is this on?</h3>
              <p className="text-muted text-sm">
                Vibecoin runs on 0G, a fast blockchain with near-zero gas fees (~$0.01). This means more of your money goes to investments, not fees.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="heading-2 mb-4">Ready to Start?</h2>
          <p className="text-muted mb-6">
            Connect your wallet and start building a portfolio of apps that pay you back.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/marketplace" className="btn btn-primary text-lg px-8 py-3">
              Browse Apps
            </Link>
            <Link href="/arena" className="btn btn-secondary text-lg px-8 py-3">
              See the Arena
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-muted">
          <p>Vibecoin &mdash; Own the Apps You Love</p>
          <p className="text-sm mt-2">Powered by 0G Blockchain</p>
        </div>
      </footer>
    </div>
  );
}
