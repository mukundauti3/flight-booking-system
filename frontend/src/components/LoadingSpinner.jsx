// components/LoadingSpinner.jsx
export default function LoadingSpinner({ text = 'Loading...' }) {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="sky-spinner" />
            {text && <p className="text-muted-sky mt-3" style={{ fontSize: 14 }}>{text}</p>}
        </div>
    );
}
