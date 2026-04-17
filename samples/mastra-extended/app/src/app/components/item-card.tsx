import type { Item } from "@/app/types";
import { formatPriority, formatTimestamp, priorityClass } from "@/app/formatting";

export function ItemCard({ item, showAssignee = false }: { item: Item; showAssignee?: boolean }) {
  return (
    <article className="item-card">
      <div className="item-topline">
        <span className="source-pill">{item.source}</span>
        <span className={`priority-pill ${priorityClass(item.priority)}`}>{formatPriority(item.priority)}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="item-body">{item.body}</p>
      <div className="meta-row">
        {showAssignee ? (
          <>
            <span>{item.assignee ? `Assigned to ${item.assignee}` : "Unassigned"}</span>
            <span>{item.status ?? "pending"}</span>
          </>
        ) : (
          <span>{formatTimestamp(item.createdAt)}</span>
        )}
        <span>{item.category ?? "classifying"}</span>
      </div>
      {item.tags.length > 0 ? (
        <div className="tag-row">
          {item.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
