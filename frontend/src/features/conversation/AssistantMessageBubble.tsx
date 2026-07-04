import { useSessionContext } from "../session/SessionContext";
import { type ApiMessage } from "../../services/api";
import {
  RestaurantCardsList,
  MenuItemCardsList,
  RecommendationCard,
  ClarificationCard,
} from "./SpecialCards";
import { Cpu } from "lucide-react";

type AssistantMessageBubbleProps = {
  message: ApiMessage;
  isLatest: boolean;
};

function parseInlineStyles(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-foreground'>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-muted/70 px-1 py-0.5 rounded font-mono text-xs text-primary'>$1</code>")
    .replace(/(₹\d+)/g, "<strong class='text-primary font-bold'>$1</strong>");
}

function formatMessageContent(content: string) {
  const paragraphs = content.split("\n\n");
  return paragraphs.map((para, pIdx) => {
    const lines = para.split("\n");
    const isBulletList = lines.length > 1 && lines.every(
      (line) =>
        line.trim().startsWith("•") ||
        line.trim().startsWith("-") ||
        line.trim().startsWith("*")
    );

    if (isBulletList) {
      return (
        <ul key={pIdx} className="list-disc pl-5 my-2 space-y-1.5 text-xs md:text-sm">
          {lines.map((line, lIdx) => {
            const cleanLine = line.trim().replace(/^[•\-*]\s*/, "");
            return (
              <li
                key={lIdx}
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseInlineStyles(cleanLine) }}
              />
            );
          })}
        </ul>
      );
    }

    return (
      <p
        key={pIdx}
        className="text-xs md:text-sm leading-relaxed mb-2.5 last:mb-0"
        dangerouslySetInnerHTML={{
          __html: lines.map(parseInlineStyles).join("<br />"),
        }}
      />
    );
  });
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function AssistantMessageBubble({ message, isLatest }: AssistantMessageBubbleProps) {
  const { session } = useSessionContext();

  const renderSpecialCards = () => {
    if (!session || !isLatest) return null;

    // 1. Recommendation results — show the first result card on the latest assistant message
    if (
      session.lastRecommendationResults &&
      session.lastRecommendationResults.length > 0
    ) {
      return <RecommendationCard recommendation={session.lastRecommendationResults[0] as any} />;
    }

    // 2. Awaiting recommendation refinement clarification
    if (session.awaitingRecommendationRefinement) {
      return <ClarificationCard />;
    }

    // 3. Awaiting restaurant selection
    if (session.awaitingRestaurantSelection && session.lastSearchResults && session.lastSearchResults.length > 0) {
      return <RestaurantCardsList candidates={session.lastSearchResults} />;
    }

    // 4. Menu fetch results
    const isMenuQuery = message.content.toLowerCase().includes("menu") || message.content.toLowerCase().includes("item");
    if (isMenuQuery && session.lastViewedMenuItems && session.lastViewedMenuItems.length > 0 && session.selectedRestaurantId) {
      return (
        <MenuItemCardsList
          items={session.lastViewedMenuItems}
          restaurantId={session.selectedRestaurantId}
        />
      );
    }

    return null;
  };

  return (
    <article className="mr-auto max-w-[85%] sm:max-w-[80%] rounded-2xl border border-border bg-card/60 backdrop-blur-sm px-4 py-3.5 shadow-sm flex gap-3 items-start">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
        <Cpu className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          FeastPilot
        </div>
        <div className="text-foreground/90 font-medium select-text">
          {formatMessageContent(message.content)}
        </div>
        
        {renderSpecialCards()}

        <div className="mt-2 text-[10px] text-muted-foreground font-semibold">
          {formatTime(message.createdAt)}
        </div>
      </div>
    </article>
  );
}
