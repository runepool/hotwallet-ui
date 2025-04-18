interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepTitles }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-center mb-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <>
            <div 
              key={`step-${index + 1}`}
              className={`flex items-center justify-center h-8 w-8 rounded-full 
                ${currentStep === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} 
                ${index === 0 ? 'mr-2' : index === totalSteps - 1 ? 'ml-2' : 'mx-2'}`}
            >
              {index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div key={`line-${index + 1}`} className="h-1 w-12 bg-gray-200 mx-2" />
            )}
          </>
        ))}
      </div>
      <div className="flex justify-center mb-6">
        <p className="text-sm font-medium text-gray-700">
          {stepTitles[currentStep - 1]}
        </p>
      </div>
    </div>
  );
}
