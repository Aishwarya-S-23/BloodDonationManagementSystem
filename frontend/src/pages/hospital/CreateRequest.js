import BloodRequestForm from '../../components/forms/BloodRequestForm';

const CreateRequest = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Blood Request</h1>
        <p className="text-gray-600 mt-1">Fill in the details to create a new blood request</p>
      </div>
      <BloodRequestForm />
    </div>
  );
};

export default CreateRequest;

