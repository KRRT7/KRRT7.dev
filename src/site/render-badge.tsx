export function RenderBadge({ renderDuration }: { renderDuration: string }) {
    return (
        <div className="render-badge" aria-label={`Rendered in ${renderDuration}`}>
            <span className="render-badge-label">
                Rendered in <strong className="render-badge-time" data-render-duration>{renderDuration}</strong>
            </span>
        </div>
    );
}
